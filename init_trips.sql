CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(36) PRIMARY KEY,
  rider_id VARCHAR(36) NOT NULL,
  driver_id VARCHAR(36) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  distance_km NUMERIC(8,2) NOT NULL,
  fare_amount NUMERIC(10,2),
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO trips (id, rider_id, driver_id, origin, destination, distance_km, fare_amount, status)
VALUES
  ('trip-001', 'rider-aaa', 'driver-zzz', 'Airport Terminal 1', 'Downtown Hotel', 18.4, 24.50, 'in_progress'),
  ('trip-002', 'rider-bbb', 'driver-yyy', 'Central Park', 'Grand Station', 6.1, 9.75, 'in_progress'),
  ('trip-003', 'rider-ccc', 'driver-xxx', 'City Mall', 'University Campus', 11.2, 15.00, 'in_progress'),
  ('trip-004', 'rider-ddd', 'driver-www', 'Harbor View', 'Business District', 4.8, 8.20, 'in_progress')
ON CONFLICT (id) DO NOTHING;
