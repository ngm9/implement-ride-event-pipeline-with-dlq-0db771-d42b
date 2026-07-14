const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'trip-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
});

let producer = null;

async function createProducer() {
  producer = kafka.producer();
  await producer.connect();
  console.log(JSON.stringify({ level: 'info', service: 'trip-service', msg: 'Kafka producer connected' }));
}

async function publishTripEvent(eventType, tripData) {
  if (!producer) {
    throw new Error('Producer not initialized');
  }

  const message = {
    topic: 'trip.completed',
    messages: [
      {
        value: JSON.stringify({
          eventType,
          tripId: tripData.id,
          riderId: tripData.rider_id,
          driverId: tripData.driver_id,
          fareAmount: tripData.fare_amount,
          distanceKm: tripData.distance_km,
          completedAt: tripData.completed_at,
        }),
      },
    ],
  };

  await producer.send(message);
}

async function shutdownProducer() {
  if (producer) {
    await producer.disconnect();
  }
}

module.exports = { createProducer, publishTripEvent, shutdownProducer };
