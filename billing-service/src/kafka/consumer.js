const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
});

async function startBillingConsumer(pool) {
  const consumer = kafka.consumer({ groupId: 'billing-service-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'trip.completed', fromBeginning: false });

  console.log(JSON.stringify({ level: 'info', service: 'billing-service', msg: 'Consumer connected and subscribed to trip.completed' }));

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value.toString();
      const event = JSON.parse(raw);

      if (event.eventType !== 'trip.completed') {
        return;
      }

      const existing = await pool.query('SELECT id FROM fares WHERE trip_id = $1', [event.tripId]);
      if (existing.rows.length > 0) {
        return;
      }

      await pool.query(
        'INSERT INTO fares (trip_id, rider_id, driver_id, amount, distance_km, status) VALUES ($1,$2,$3,$4,$5,$6)',
        [event.tripId, event.riderId, event.driverId, event.fareAmount, event.distanceKm, 'pending']
      );

      console.log(JSON.stringify({ level: 'info', service: 'billing-service', tripId: event.tripId, msg: 'Fare record created' }));
    },
  });
}

module.exports = { startBillingConsumer };
