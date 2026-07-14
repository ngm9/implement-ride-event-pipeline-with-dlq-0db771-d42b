CREATE TABLE IF NOT EXISTS fares (
  id SERIAL PRIMARY KEY,
  trip_id VARCHAR(36) NOT NULL,
  rider_id VARCHAR(36) NOT NULL,
  driver_id VARCHAR(36) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  distance_km NUMERIC(8,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  event_offset BIGINT,
  event_partition INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dead_letters (
  id SERIAL PRIMARY KEY,
  trip_id VARCHAR(36),
  raw_payload TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  original_topic VARCHAR(255),
  original_partition INT,
  original_offset BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
