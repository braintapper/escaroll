# Docker Deployment

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- The printer must be reachable from the Docker host over the network

---

## Quick start

```bash
cp .env.example .env   # set ESCAROLL_PRINTER_IP
docker compose up -d
```

The UI will be available at `http://localhost:3000`.

---

## Environment variables

Set these in your `.env` file or pass them directly to `docker compose`:

| Variable | Default | Description |
|----------|---------|-------------|
| `ESCAROLL_PRINTER_IP` | `192.168.1.17` | LAN IP of the ESC/POS printer |
| `ESCAROLL_TEMPLATES_PATH` | `/data/templates` | Path inside the container for YAML templates |

---

## Data volume

The `./data` directory on the host is mounted to `/data` inside the container. This is where templates are stored and persisted between container restarts.

```
./data/
  templates/     ← YAML template files (read/write)
  images/        ← source images referenced in templates (read)
```

Create the directory before first run if it does not exist:

```bash
mkdir -p data/templates
```

---

## Printer networking

The container connects to the printer via raw TCP on port 9100. With Docker's default bridge networking the container can reach any host on the same LAN as the Docker host — no special network configuration is required for most setups.

If the printer is not reachable, try adding `network_mode: host` to the service in `docker-compose.yml` (Linux hosts only):

```yaml
services:
  escaroll:
    network_mode: host
    ...
```

---

## Build notes

The Dockerfile uses a two-stage build:

1. **Builder stage** — installs all dependencies and runs `nuxt build`, producing the Nitro server output in `.output/`
2. **Production stage** — installs only production dependencies in the target Linux environment (ensuring sharp's native binaries match the runtime platform), then copies `.output/` from the builder

This means the final image does not contain source files, dev dependencies, or build tooling.

---

## Unraid

Add a new Docker container in the Unraid UI with the following settings:

| Field | Value |
|-------|-------|
| Repository | `escaroll` (after building locally or pushing to a registry) |
| Network type | Bridge |
| Port mapping | Host `3000` → Container `3000` |
| Variable `ESCAROLL_PRINTER_IP` | Your printer's IP |
| Path `/data` | An Unraid share path, e.g. `/mnt/user/appdata/escaroll/data` |

Or use the provided `docker-compose.yml` via Unraid's Compose Manager plugin.
