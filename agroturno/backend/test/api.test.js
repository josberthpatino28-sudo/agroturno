// Pruebas de integración de la API. Requieren la base de datos inicializada (npm run db:init).
// Ejecutar con: npm test
require('dotenv').config();
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const pool = require('../src/db/pool');

let servidor;
let base;
let tokenProductor;
let tokenAdmin;
const correo = `prueba${Date.now()}@agroturno.co`;

// Fecha futura fija (mañana a las 7:00) para evitar el error "en el pasado"
const manana = new Date(Date.now() + 86_400_000);
manana.setHours(7, 0, 0, 0);
const horas = (h) => new Date(manana.getTime() + h * 3_600_000).toISOString();

async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await res.text();
  return { status: res.status, datos: texto ? JSON.parse(texto) : null };
}

before(async () => {
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}/api`;
  await pool.query('DELETE FROM reservas');
});

after(async () => {
  servidor.close();
  await pool.end();
});

test('registro de productor devuelve 201 y token', async () => {
  const r = await pedir('/auth/registro', {
    metodo: 'POST',
    cuerpo: { nombre: 'Productor de prueba', correo, contrasena: 'Clave12345' },
  });
  assert.strictEqual(r.status, 201);
  assert.ok(r.datos.token);
  tokenProductor = r.datos.token;
});

test('login con contraseña errada devuelve 401', async () => {
  const r = await pedir('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena: 'mala' } });
  assert.strictEqual(r.status, 401);
});

test('login de administrador funciona', async () => {
  const r = await pedir('/auth/login', {
    metodo: 'POST',
    cuerpo: { correo: 'admin@agroturno.co', contrasena: 'Admin2026*' },
  });
  assert.strictEqual(r.status, 200);
  tokenAdmin = r.datos.token;
});

test('catálogo de máquinas es público', async () => {
  const r = await pedir('/maquinas');
  assert.strictEqual(r.status, 200);
  assert.ok(r.datos.length >= 4);
});

test('un productor no puede crear máquinas (403)', async () => {
  const r = await pedir('/maquinas', {
    metodo: 'POST',
    token: tokenProductor,
    cuerpo: { nombre: 'X', tipo: 'Y', tarifa_hora: 1 },
  });
  assert.strictEqual(r.status, 403);
});

test('reservas sin token devuelven 401', async () => {
  const r = await pedir('/reservas');
  assert.strictEqual(r.status, 401);
});

test('reserva válida se crea y calcula el valor (4 h × 85.000)', async () => {
  const r = await pedir('/reservas', {
    metodo: 'POST',
    token: tokenProductor,
    cuerpo: { maquina_id: 1, inicio: horas(0), fin: horas(4) },
  });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(Number(r.datos.valor), 340000);
});

test('reserva cruzada en la misma máquina devuelve 409', async () => {
  const r = await pedir('/reservas', {
    metodo: 'POST',
    token: tokenAdmin,
    cuerpo: { maquina_id: 1, inicio: horas(2), fin: horas(6) },
  });
  assert.strictEqual(r.status, 409);
});

test('misma franja en otra máquina sí se permite', async () => {
  const r = await pedir('/reservas', {
    metodo: 'POST',
    token: tokenAdmin,
    cuerpo: { maquina_id: 2, inicio: horas(2), fin: horas(6) },
  });
  assert.strictEqual(r.status, 201);
});

test('fin anterior al inicio devuelve 400', async () => {
  const r = await pedir('/reservas', {
    metodo: 'POST',
    token: tokenProductor,
    cuerpo: { maquina_id: 3, inicio: horas(5), fin: horas(4) },
  });
  assert.strictEqual(r.status, 400);
});

test('el productor solo ve sus reservas; el administrador ve todas', async () => {
  const propias = await pedir('/reservas', { token: tokenProductor });
  const todas = await pedir('/reservas', { token: tokenAdmin });
  assert.strictEqual(propias.datos.length, 1);
  assert.strictEqual(todas.datos.length, 2);
});

test('cancelar libera el horario para otra reserva', async () => {
  const propias = await pedir('/reservas', { token: tokenProductor });
  const id = propias.datos[0].id;
  const c = await pedir(`/reservas/${id}/cancelar`, { metodo: 'PATCH', token: tokenProductor });
  assert.strictEqual(c.status, 200);
  assert.strictEqual(c.datos.estado, 'cancelada');
  const r = await pedir('/reservas', {
    metodo: 'POST',
    token: tokenAdmin,
    cuerpo: { maquina_id: 1, inicio: horas(1), fin: horas(3) },
  });
  assert.strictEqual(r.status, 201);
});

test('la documentación Swagger está disponible', async () => {
  const res = await fetch(base + '/docs/');
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /swagger/i);
});
