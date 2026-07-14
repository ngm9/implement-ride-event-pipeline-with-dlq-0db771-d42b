const express = require('express');
const { Pool } = require('pg');
const { startBillingConsumer } = require('./kafka/consumer');
const billingRoutes = require('./routes/billing');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'billing-service' });
});

app.use('/billing', billingRoutes(pool));

async function start() {
  const PORT = process.env.PORT || 4002;
  const server = app.listen(PORT, () => {
    console.log(JSON.stringify({ level: 'info', service: 'billing-service', msg: `Listening on port ${PORT}` }));
  });

  await startBillingConsumer(pool);

  const shutdown = async (signal) => {
    console.log(JSON.stringify({ level: 'info', service: 'billing-service', msg: `Received ${signal}, shutting down` }));
    server.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error(JSON.stringify({ level: 'error', service: 'billing-service', msg: 'Startup failed', error: err.message }));
  process.exit(1);
});
