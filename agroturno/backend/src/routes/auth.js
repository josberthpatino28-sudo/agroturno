const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// POST /api/auth/registro
router.post('/registro', async (req, res, next) => {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre || !correo || !contrasena || contrasena.length < 8) {
      return res.status(400).json({
        error: 'Nombre, correo y contraseña (mínimo 8 caracteres) son obligatorios',
      });
    }
    const hash = await bcrypt.hash(contrasena, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, contrasena)
       VALUES ($1, $2, $3) RETURNING id, nombre, correo, rol`,
      [nombre.trim(), correo.trim().toLowerCase(), hash]
    );
    res.status(201).json({ usuario: rows[0], token: firmarToken(rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [
      String(correo || '').trim().toLowerCase(),
    ]);
    const usuario = rows[0];
    if (!usuario || !(await bcrypt.compare(contrasena || '', usuario.contrasena))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    const { contrasena: _omitida, ...publico } = usuario;
    res.json({ usuario: publico, token: firmarToken(usuario) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
