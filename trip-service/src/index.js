const express = require('express');
const { Pool } = require('pg');
const { createProducer, shutdownProducer } = require('./kafka/producer');
const tripRoutes = require('./routes/trips');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'trip-service' });
});

async function start() {
  await createProducer();
  app.use('/trips', tripRoutes(pool));

  const PORT = process.env.PORT || 4001;
  const server = app.listen(PORT, () => {
    console.log(JSON.stringify({ level: 'info', service: 'trip-service', msg: `Listening on port ${PORT}` }));
  });

  const shutdown = async (signal) => {
    console.log(JSON.stringify({ level: 'info', service: 'trip-service', msg: `Received ${signal}, shutting down` }));
    server.close();
    await shutdownProducer();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error(JSON.stringify({ level: 'error', service: 'trip-service', msg: 'Startup failed', error: err.message }));
  process.exit(1);
});
