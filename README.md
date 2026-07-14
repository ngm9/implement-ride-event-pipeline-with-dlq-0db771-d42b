# Ride Event Pipeline — Billing Reliability Task

## Task Overview

RideWave is a ride-hailing platform processing thousands of trip completions per minute. When a rider finishes a trip, the Trip Service emits a `trip.completed` event to Kafka, which the Billing Service consumes to calculate and persist fare records. The current system has been causing billing gaps in production — some completed trips never generate a fare record, duplicate charges appear after consumer restarts, and the Billing Service occasionally crashes entirely when it receives malformed events from upstream. The engineering team needs the event pipeline hardened so that every completed trip is billed exactly once, failures are captured for investigation rather than silently dropped, and on-call engineers can trace any message through the system without reading raw Kafka offsets.

## Objectives

- Trip completion events are published to Kafka such that all events for the same ride are always routed to the same partition, preserving per-ride ordering
- The Billing Service processes each `trip.completed` event and creates a fare record exactly once — restarting the consumer or replaying messages must not produce duplicate fare entries
- When a billing attempt fails, the system retries the event a configurable number of times before routing it to a separate topic for failed messages; retried and dead-lettered events must retain enough context to understand what went wrong
- A malformed or unprocessable event must not halt processing of subsequent messages — the consumer recovers and continues
- Enough structured log output is produced that an engineer can follow a single trip's event from publication through billing (or failure) using only log lines

## How to Verify

- `POST /trips/:id/complete` on the Trip Service should trigger an event visible in Kafka; the Billing Service logs should show the event being received and a fare record appearing in the `billing_db.fares` table
- Sending the same trip completion twice should result in exactly one fare record, not two — check the `fares` table directly
- Deliberately sending a trip event that causes a billing failure (e.g., a trip with a negative or missing fare amount) should eventually appear in the dead-letter topic and be queryable via `GET /billing/dead-letters` on the Billing Service, without stopping the consumer from processing subsequent events
- Restarting the Billing Service container mid-consumption and then sending new events should result in no messages being lost or double-processed
- Log output across both services should share a consistent identifier per trip that allows filtering all log lines for a single ride

## Helpful Tips

- Consider what happens to offset commits if a message is acknowledged before the database write completes versus after — think about which order creates which kind of risk
- Think about how to distinguish a transient error (network blip, database timeout) from a permanent error (invalid payload structure) when deciding whether to retry or route to a dead-letter destination
- Explore how a consumer can know it has already processed a message without querying Kafka — what information from the event itself or the database can serve as a natural deduplication key
- Review how Kafka partition assignment relates to ordering guarantees, and consider what a good partition key looks like for a domain where multiple events per ride must stay in sequence
- Consider what metadata a dead-lettered message should carry so that an engineer receiving an alert can understand the original event, the failure reason, and how many times it was retried — without needing to look at anything other than the dead-letter record
