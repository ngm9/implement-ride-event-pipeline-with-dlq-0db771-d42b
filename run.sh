#!/usr/bin/env bash
set -e

echo "[run.sh] Building and starting all services..."
docker-compose up -d --build

echo "[run.sh] Waiting for Kafka to be healthy..."
RETRIES=30
COUNT=0
until docker inspect --format='{{.State.Health.Status}}' kafka 2>/dev/null | grep -q 'healthy'; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "[run.sh] ERROR: Kafka did not become healthy in time."
    docker-compose logs kafka
    exit 1
  fi
  echo "[run.sh] Kafka not ready yet... ($COUNT/$RETRIES)"
  sleep 5
done
echo "[run.sh] Kafka is healthy."

echo "[run.sh] Waiting for trip-service to be healthy..."
COUNT=0
until docker inspect --format='{{.State.Health.Status}}' trip-service 2>/dev/null | grep -q 'healthy'; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "[run.sh] ERROR: trip-service did not become healthy in time."
    docker-compose logs trip-service
    exit 1
  fi
  echo "[run.sh] trip-service not ready yet... ($COUNT/$RETRIES)"
  sleep 3
done
echo "[run.sh] trip-service is healthy."

echo "[run.sh] Waiting for billing-service to be healthy..."
COUNT=0
until docker inspect --format='{{.State.Health.Status}}' billing-service 2>/dev/null | grep -q 'healthy'; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$RETRIES" ]; then
    echo "[run.sh] ERROR: billing-service did not become healthy in time."
    docker-compose logs billing-service
    exit 1
  fi
  echo "[run.sh] billing-service not ready yet... ($COUNT/$RETRIES)"
  sleep 3
done
echo "[run.sh] billing-service is healthy."

echo ""
echo "========================================"
echo " RideWave Pipeline is READY"
echo "========================================"
echo " Trip Service:    http://localhost:4001"
echo " Billing Service: http://localhost:4002"
echo " Kafka Broker:    localhost:9092"
echo "========================================"
