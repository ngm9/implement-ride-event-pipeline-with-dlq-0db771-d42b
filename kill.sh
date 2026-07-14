#!/usr/bin/env bash
set -e

echo "[kill.sh] Changing to task directory..."
cd /root/task

echo "[kill.sh] Bringing down docker-compose with all volumes and images..."
docker-compose down --rmi all --volumes --remove-orphans || true

echo "[kill.sh] Force-stopping all running containers..."
docker ps -q | xargs -r docker stop || true

echo "[kill.sh] Removing all containers..."
docker ps -aq | xargs -r docker rm -f || true

echo "[kill.sh] Pruning volumes..."
docker volume prune -f || true

echo "[kill.sh] Pruning images..."
docker image prune -a -f || true

echo "[kill.sh] Full system prune..."
docker system prune -a --volumes -f || true

echo "[kill.sh] Removing task directory..."
rm -rf /root/task || true

echo "[kill.sh] Cleanup completed."
