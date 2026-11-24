const express = require('express');
const pool = require('../db/pool');
const { autenticar, permitir } = require('../middleware/auth');

const router = express.Router();

// GET /api/maquinas — catálogo público de maquinaria
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM maquinas ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/maquinas/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM maquinas WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Máquina no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

function validarMaquina(body) {
  const { nombre, tipo, tarifa_hora } = body;
  if (!nombre || !tipo || tarifa_hora === undefined || Number(tarifa_hora) < 0) {
    return 'Nombre, tipo y tarifa por hora (no negativa) son obligatorios';
  }
  return null;
}

// POST /api/maquinas — solo administrador
router.post('/', autenticar, permitir('administrador'), async (req, res, next) => {
  try {
    const error = validarMaquina(req.body);
    if (error) return res.status(400).json({ error });
    const { nombre, tipo, tarifa_hora } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO maquinas (nombre, tipo, tarifa_hora) VALUES ($1, $2, $3) RETURNING *',
      [nombre, tipo, tarifa_hora]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/maquinas/:id — solo administrador
router.put('/:id', autenticar, permitir('administrador'), async (req, res, next) => {
  try {
    const error = validarMaquina(req.body);
    if (error) return res.status(400).json({ error });
    const { nombre, tipo, tarifa_hora, estado = 'disponible' } = req.body;
    const { rows } = await pool.query(
      `UPDATE maquinas SET nombre = $1, tipo = $2, tarifa_hora = $3, estado = $4
       WHERE id = $5 RETURNING *`,
      [nombre, tipo, tarifa_hora, estado, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Máquina no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/maquinas/:id — solo administrador
router.delete('/:id', autenticar, permitir('administrador'), async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM maquinas WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Máquina no encontrada' });
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'La máquina tiene reservas; póngala en mantenimiento' });
    }
    next(err);
  }
});

module.exports = router;
