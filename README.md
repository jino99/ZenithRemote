# ZRemote

Secure, zero-install, browser-native remote desktop platform built on WebRTC P2P.

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`

## Deploy to VPS

```bash
npm install
npm run build
NODE_ENV=production node server.ts
```

Set these environment variables on your VPS:

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Random secret for session signing (required) |
| `PORT` | Port to listen on (default: `3000`) |

Use a reverse proxy (nginx/caddy) in front for TLS termination.

### Example nginx config

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
