const express = require('express');
const pool = require('../db/pool');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
router.use(autenticar); // todas las rutas de reservas requieren sesión

// GET /api/reservas — el productor ve las suyas; el administrador ve todas
router.get('/', async (req, res, next) => {
  try {
    const esAdmin = req.usuario.rol === 'administrador';
    const { rows } = await pool.query(
      `SELECT r.*, m.nombre AS maquina, u.nombre AS productor
         FROM reservas r
         JOIN maquinas m ON m.id = r.maquina_id
         JOIN usuarios u ON u.id = r.usuario_id
        WHERE ($1::boolean OR r.usuario_id = $2)
        ORDER BY r.inicio DESC`,
      [esAdmin, req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/reservas — crea una reserva y calcula el valor según la tarifa
router.post('/', async (req, res, next) => {
  try {
    const { maquina_id, inicio, fin } = req.body;
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    if (!maquina_id || isNaN(fechaInicio) || isNaN(fechaFin) || fechaFin <= fechaInicio) {
      return res.status(400).json({ error: 'Máquina, inicio y fin válidos son obligatorios (fin > inicio)' });
    }
    if (fechaInicio < new Date()) {
      return res.status(400).json({ error: 'No se puede reservar en el pasado' });
    }

    const { rows: maq } = await pool.query('SELECT * FROM maquinas WHERE id = $1', [maquina_id]);
    if (!maq[0]) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (maq[0].estado !== 'disponible') {
      return res.status(409).json({ error: 'La máquina está en mantenimiento' });
    }

    // Regla de cobro única: horas × tarifa (evita cobros inconsistentes)
    const horas = (fechaFin - fechaInicio) / 3_600_000;
    const valor = Math.round(horas * Number(maq[0].tarifa_hora));

    const { rows } = await pool.query(
      `INSERT INTO reservas (usuario_id, maquina_id, inicio, fin, valor)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.usuario.id, maquina_id, fechaInicio, fechaFin, valor]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    // 23P01 = violación de la restricción EXCLUDE: la máquina ya está reservada en ese horario
    if (err.code === '23P01') {
      return res.status(409).json({ error: 'La máquina ya está reservada en ese horario' });
    }
    next(err);
  }
});

// PATCH /api/reservas/:id/cancelar — el dueño de la reserva o el administrador
router.patch('/:id/cancelar', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    const reserva = rows[0];
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reserva.usuario_id !== req.usuario.id && req.usuario.rol !== 'administrador') {
      return res.status(403).json({ error: 'No puede cancelar reservas de otro productor' });
    }
    const { rows: act } = await pool.query(
      `UPDATE reservas SET estado = 'cancelada' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(act[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
