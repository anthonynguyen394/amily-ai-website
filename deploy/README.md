# Deploy

Docker + Cloudflare Tunnel stack for hosting amily.ai on the Raspberry Pi (`amily`, 192.168.1.25).

## Architecture

- `web` (nginx:1.27-alpine) — multi-stage build compiles Vite site, nginx serves `dist/`. No host ports.
- `cloudflared` — Cloudflare tunnel container, routes `amily.ai` -> `web:80`. Outbound-only to Cloudflare edge.
- Internal bridge network `amily-net`. Nothing exposed to the LAN or WAN directly.
- Resource caps: 128MB / 0.5 CPU (web), 128MB / 0.25 CPU (cloudflared). Total ~256MB to protect bitcoind on the 4GB Pi.

## One-time Cloudflare setup

1. Cloudflare dashboard -> Zero Trust -> Networks -> Tunnels -> Create tunnel -> name `amily-pi`.
2. Copy the install token (`eyJ...`). This goes into `.env` on the Pi.
3. Public Hostnames tab -> Add:
   - Hostname: `amily.ai` (apex, no subdomain prefix)
   - Service: `HTTP` `web:80`
4. DNS CNAME is auto-created (proxied / orange cloud).

## One-time Pi setup

```bash
# Install Docker (Pi has no Docker yet)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker amily
# log out / back in so the group takes effect

# Clone repo
cd ~
git clone https://github.com/<owner>/amily-ai-website.git
cd amily-ai-website/deploy

# Create .env
cp .env.example .env
nano .env   # paste TUNNEL_TOKEN=eyJ...
chmod 600 .env

# Install and enable systemd unit
sudo cp systemd/amily-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now amily-web.service
```

## Verify

```bash
docker compose ps                        # both services up + healthy
docker compose logs -f cloudflared       # expect 4x "Registered tunnel connection"
curl -I https://amily.ai                 # from any other machine -> HTTP/2 200, server: cloudflare
docker stats --no-stream                 # confirm memory stays under limits
```

## Update workflow

The systemd unit runs `git pull --ff-only` + `docker compose up -d --build` on start. To deploy a new version:

```bash
sudo systemctl restart amily-web
```

Or just `cd ~/amily-ai-website && git pull && cd deploy && docker compose up -d --build` manually.

## Survives

- Reboots: `restart: unless-stopped` + systemd `enable` = auto-start on boot.
- Crashes/OOM: Docker restarts containers automatically.
- Power loss: same as reboot.

Sleep is already disabled on this Pi (see `projects/raspberry-pi-node/README.md` in amily-ai repo).
