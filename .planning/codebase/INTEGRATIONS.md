# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Lark (Feishu):**
- Service: Lark Bot webhook notifications
- Where used: `processing-flash-pick`, `flash-pick-service`, `user-service`
- Files: `src/shared/logger/transports/lark.transport.ts` (all three services)
- SDK/Client: Custom HTTP implementation via axios
- Auth: `LARK_BOT_WEBHOOK` (URL with embedded token), `LARK_BOT_SECRET` (HMAC signing key)
- Purpose: Send alerts/logs to Lark workspace channels

**Thotool API:**
- Service: thotool.com - External data source
- Where used: `thotool-sync` service
- SDK/Client: Custom fetch implementation via undici
- Auth: `THOTOOL_SID` (session cookie, ưu tiên) hoặc `THOTOOL_TOKEN` (JWT token cũ, fallback)
- Purpose: Fetch promotional links and sync to PostgreSQL

**User Service (Internal):**
- Service: Internal HTTP API for user/auth verification
- Where used: `flash-pick-service`
- Files: `flash-pick-service/src/modules/external-api/infrastructure/http/user-service-client-verifier.ts`
- SDK/Client: axios HTTP client
- Fallback: Kafka request-reply if HTTP unavailable
- Config: `USER_SERVICE_URL=http://localhost:3001`
- Purpose: Verify API client credentials and user authentication

## Data Storage

**Databases:**

**PostgreSQL (Relational Data):**
- Providers: PostgreSQL 14+
- Services: `processing-flash-pick`, `user-service`
- Connection vars:
  - processing-flash-pick: `SILVER_DATABASE_URL`
  - user-service: `POSTGRES_URI`
- Client: Prisma ORM (@prisma/client)
- Schemas:
  - user-service: `user_service` (Users, RefreshTokens), `connector` (ApiClients, ClientTokens)
  - processing-flash-pick: Uses direct PostgreSQL adapter (@prisma/adapter-pg)
- Purpose: User/auth data, API client management, Silver layer transformations

**MongoDB (Document Store):**
- Provider: MongoDB 7.0+
- Service: `processing-flash-pick` only (Bronze layer)
- Connection var: `BRONZE_DATABASE_URL`
- Client: mongodb driver
- Collection: `shope_product_flash_sale` (raw flash-pick data)
- Purpose: Raw source data storage from external APIs

**ClickHouse (Data Warehouse):**
- Provider: ClickHouse 24.x
- Services: `processing-flash-pick`, `flash-pick-service`
- Connection vars:
  - processing-flash-pick: `GOLD_DATABASE_URL=http://default:default@localhost:8123/flashpick_local`
  - flash-pick-service: `GOLD_DATABASE_URL=http://default:default@localhost:8123/flashpick_local`
- Client: @clickhouse/client
- Tables: `product_snapshot`, `product_flash_sale` (OLAP queries)
- Purpose: Gold layer analytics, reporting, fast queries on aggregated data

**File Storage:**
- Shopee Image CDN only (no local file storage)
- Base URL: `SHOPEE_IMAGE_BASE_URL=https://down-vn.img.susercontent.com/file`
- Image variants via suffix: `SHOPEE_IMAGE_SUFFIX`, `SHOPEE_AUTOCOMPLETE_IMAGE_SUFFIX`

**Caching:**
- Redis 7.0+
- Services: `processing-flash-pick`, `flash-pick-service`
- Connection: `REDIS_URI=redis://default:default@localhost:6380/0`
- Client: ioredis
- Uses: BullMQ job queue, general caching, cron heartbeat
- Heartbeat pattern: `CRON_HEARTBEAT_PATTERN=*/5 * * * *`

## Authentication & Identity

**Auth Providers:**

**JWT (Custom Implementation):**
- Service: `user-service`
- Implementation: @nestjs/jwt + @nestjs/passport + passport-jwt
- Files: `user-service/src/modules/auth/`
- Config vars:
  - `JWT_SECRET` - Signing key for tokens
  - `JWT_EXPIRES_IN=15m` - Access token lifetime
  - `JWT_REFRESH_EXPIRES_IN=7d` - Refresh token lifetime
- Database: PostgreSQL `user_service.users`, `user_service.refresh_tokens`
- Purpose: User login/logout, token issuance and validation

**API Client Credentials (External API):**
- Service: `user-service` connector module
- Files: `user-service/src/modules/connector/`
- Database tables:
  - `connector.api_clients` - API client registration
  - `connector.client_tokens` - Client API tokens
- Auth mechanism: Client ID + Secret (bcrypt hashed) + HMAC checksum
- Env: `CHECKSUM_TIMESTAMP_TOLERANCE_MS=300000` - Allow 5-min clock skew
- Purpose: Third-party API client authentication and authorization

**Webhook Signature Verification:**
- Uses HMAC-SHA256 with `webhookSecret` from `api_clients` table
- Implementation: `user-service/src/modules/connector/infrastructure/webhook/http-webhook-dispatcher.ts`
- Config: `WEBHOOK_TIMEOUT_MS=5000`, `WEBHOOK_RETRY_ATTEMPTS=3`

## Monitoring & Observability

**Error Tracking:**
- Lark Bot webhook for critical errors/alerts (see Lark integration above)
- No external error tracking service (Sentry, Rollbar) detected

**Logs:**
- Pino JSON logger (all services)
- Transport: Console (development) + Log files with rotation (production)
- Lark transport for critical events (`LARK_BOT_WEBHOOK`)
- Log files: Rotated via pino-roll
- Pretty-printing: pino-pretty in development

**Distributed Tracing & Metrics (OpenTelemetry):**
- Framework: OpenTelemetry SDK
- Services: `flash-pick-service`, `user-service` (both support OTel)
- Status: Optional - disabled by default (`OTEL_ENABLED=false`)
- Exporters:
  - Traces: OTLP HTTP exporter (`OTEL_EXPORTER_OTLP_ENDPOINT`)
  - Metrics: Prometheus metrics exporter on port 9464
- Config:
  - `OTEL_SERVICE_NAME=api-flash-pick`
  - `OTEL_PROMETHEUS_PORT=9464` (default)
  - `OTEL_EXPORTER_OTLP_ENDPOINT` - Collector endpoint (optional)
- When disabled: All OTel calls are no-ops, no extra ports opened
- Integration: nestjs-otel 8.0.2 (flash-pick-service)

## CI/CD & Deployment

**Hosting:**
- Docker container runtime (multi-container deployment)
- Infrastructure: Managed via Docker Compose (devops/infra/docker-compose.yml)
- API Gateway: Kong (devops/kong/docker-compose.yml) - API routing/load balancing

**Deployment Components:**
- Dockerfile for: `processing-flash-pick`, `flash-pick-service`, `user-service`
- CI/CD: GitHub Actions (inferred from git repo, not fully explored)
- Build output: TypeScript compiled to JavaScript in `dist/` directory

**Database Migrations:**
- PostgreSQL: Prisma migrations (`user-service/prisma/migrate/`)
- ClickHouse: Custom migration scripts (`scripts/run-clickhouse-migrations.ts/js`)

## Environment Configuration

**Required env vars by service:**

**processing-flash-pick:**
- `NODE_ENV`, `PORT=3001`
- `BRONZE_DATABASE_URL`, `SILVER_DATABASE_URL`, `GOLD_DATABASE_URL`
- `REDIS_URI`, `CRON_HEARTBEAT_PATTERN`
- `FLASH_PICK_CRON_ENABLED`, `FLASH_PICK_CRON_PATTERN`
- `LARK_BOT_WEBHOOK`, `LARK_BOT_SECRET`
- `KAFKA_BROKERS`, `KAFKA_ENABLED` (optional)

**flash-pick-service:**
- `NODE_ENV`, `PORT=3000`, `SERVER_URL`, `CORS_ORIGIN[S]`
- `GOLD_DATABASE_URL`, `REDIS_URI`
- `SHOPEE_IMAGE_BASE_URL`, `SHOPEE_IMAGE_SUFFIX`
- `LARK_BOT_WEBHOOK`, `LARK_BOT_SECRET`
- `DOCS_USER`, `DOCS_PASS` (Basic auth for Swagger docs)
- `OTEL_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_PROMETHEUS_PORT` (optional)
- `USER_SERVICE_URL`
- `KAFKA_ENABLED`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_REQUEST_REPLY_TIMEOUT_MS`, `KAFKA_REPLY_TOPIC`, `KAFKA_REPLY_GROUP_ID` (optional)

**user-service:**
- `NODE_ENV`, `PORT=3001`, `SERVER_URL`
- `POSTGRES_URI`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `KAFKA_ENABLED`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_GROUP_ID`, `KAFKA_REQUEST_HANDLER_GROUP_ID` (optional)
- `CHECKSUM_TIMESTAMP_TOLERANCE_MS`, `EXTERNAL_RATE_LIMIT_RPM_DEFAULT`
- `WEBHOOK_TIMEOUT_MS`, `WEBHOOK_RETRY_ATTEMPTS`
- `DOCS_USER`, `DOCS_PASS`

**thotool-sync:**
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` (or combined `POSTGRES_URI`)
- `THOTOOL_SID` (session ID, bắt buộc), `THOTOOL_TOKEN` (JWT fallback), `THOTOOL_TIMEZONE`
- `DELETE_AFTER_SYNC` (default true)
- `DELETE_BEFORE_DAYS` (default 3)
- `DB_BATCH_SIZE`, `DELETE_BATCH_SIZE` (optional tuning)

**Secrets location:**
- `.env` file at service root (not committed, listed in `.gitignore`)
- dotenvx supports `.env.vault` for encrypted secrets in version control
- All sensitive values (API keys, tokens, passwords) must be injected at runtime

## Webhooks & Callbacks

**Incoming Webhooks:**
- Endpoint: `user-service` webhook receiver
- Purpose: External systems notify about API client events
- Configuration: `WEBHOOK_TIMEOUT_MS=5000`, `WEBHOOK_RETRY_ATTEMPTS=3`
- Signature verification: HMAC-SHA256 using `webhookSecret` from api_clients table
- Implementation: `user-service/src/modules/connector/infrastructure/webhook/http-webhook-dispatcher.ts`

**Outgoing Webhooks:**
- Services can register webhook URLs in `api_clients.webhookUrl`
- Dispatcher sends signed HTTP POST requests to registered endpoints
- Retry logic: Up to 3 attempts with exponential backoff

## Inter-Service Communication

**HTTP (Synchronous):**
- Primary: flash-pick-service → user-service for credential verification
- Endpoint: `USER_SERVICE_URL` configuration
- Fallback: Kafka request-reply if HTTP unavailable

**Kafka (Asynchronous Message Queue):**
- Brokers: `KAFKA_BROKERS=localhost:9092` (optional)
- Status: Disabled by default (`KAFKA_ENABLED=false`)
- Topics:
  - `internal.flash-pick-service.replies` - Response topic for flash-pick-service
- Client IDs: `flash-pick-service`, `user-service`
- Request-Reply pattern: Service sends request, waits for reply with timeout
- Timeout: `KAFKA_REQUEST_REPLY_TIMEOUT_MS=5000`
- Consumer groups:
  - user-service: `user-service-group`, `user-service-request-handler`
  - flash-pick-service: `flash-pick-service-replies`

---

*Integration audit: 2026-03-20*
