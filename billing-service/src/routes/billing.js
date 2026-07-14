module.exports = function (pool) {
  const router = require('express').Router();

  router.get('/fares', async (req, res) => {
    const result = await pool.query('SELECT * FROM fares ORDER BY created_at DESC');
    res.json(result.rows);
  });

  router.get('/fares/:tripId', async (req, res) => {
    const result = await pool.query('SELECT * FROM fares WHERE trip_id = $1', [req.params.tripId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fare not found' });
    res.json(result.rows[0]);
  });

  router.get('/dead-letters', async (req, res) => {
    const result = await pool.query('SELECT * FROM dead_letters ORDER BY created_at DESC');
    res.json(result.rows);
  });

  return router;
};
