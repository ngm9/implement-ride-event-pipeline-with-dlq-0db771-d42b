const { v4: uuidv4 } = require('uuid');
const { publishTripEvent } = require('../kafka/producer');

module.exports = function (pool) {
  const router = require('express').Router();

  router.get('/', async (req, res) => {
    const result = await pool.query('SELECT * FROM trips ORDER BY created_at DESC');
    res.json(result.rows);
  });

  router.get('/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    res.json(result.rows[0]);
  });

  router.post('/', async (req, res) => {
    const { rider_id, driver_id, origin, destination, distance_km, fare_amount } = req.body;
    if (!rider_id || !driver_id || !origin || !destination || !distance_km) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO trips (id, rider_id, driver_id, origin, destination, distance_km, fare_amount, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [id, rider_id, driver_id, origin, destination, distance_km, fare_amount || null, 'in_progress']
    );
    res.status(201).json(result.rows[0]);
  });

  router.post('/:id/complete', async (req, res) => {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    if (existing.rows[0].status === 'completed') {
      return res.status(409).json({ error: 'Trip already completed' });
    }

    const result = await pool.query(
      'UPDATE trips SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *',
      ['completed', id]
    );

    const trip = result.rows[0];

    try {
      await publishTripEvent('trip.completed', trip);
      console.log(JSON.stringify({ level: 'info', service: 'trip-service', tripId: id, msg: 'Event published' }));
    } catch (err) {
      console.error(JSON.stringify({ level: 'error', service: 'trip-service', tripId: id, msg: 'Failed to publish event', error: err.message }));
    }

    res.json({ message: 'Trip completed', trip });
  });

  return router;
};
