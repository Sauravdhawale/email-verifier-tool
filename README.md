# Bulk Email Verification Dashboard

Clean internal dashboard for uploading CSV/XLSX email lists, validating addresses through a hosted Reacher API, tracking jobs, and downloading cleaned CSV results.

## Architecture

Netlify Frontend -> VPS Backend API -> Reacher API -> PostgreSQL Database

The frontend is a React + Vite app. The backend is Node.js + Express with PostgreSQL and a simple background processor.

## Project Structure

```text
client/   React dashboard for Netlify
server/   Express API, upload handling, Reacher integration, PostgreSQL schema
```

## Local Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Create a PostgreSQL database, then put its connection string in `server/.env`.

```env
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/email_verifier
REACHER_API_URL=https://your-reacher-api-domain.com
REACHER_API_KEY=
VALIDATION_DELAY_MS=500
FRONTEND_URL=http://localhost:5173
PORT=5000
```

The Reacher API key is optional. Leave `REACHER_API_KEY` empty if your hosted Reacher API does not require authentication. Add it later when ready.

For the frontend:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run the backend:

```bash
npm run dev:server
```

Run the frontend in a second terminal:

```bash
npm run dev:client
```

Open `http://localhost:5173`.

## Production Build

Frontend:

```bash
npm run build --workspace client
```

Backend:

```bash
npm run start --workspace server
```

## GitHub Push

Do not commit `.env` files or real API keys. Only `.env.example` files should be pushed.

```bash
git init
git add .
git commit -m "Initial commit: bulk email verification dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

## Netlify Frontend Deployment

Deploy only the `client` frontend to Netlify.

Netlify settings:

```text
Base directory: client
Build command: npm install && npm run build
Publish directory: client/dist
```

Add this Netlify environment variable:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

`client/netlify.toml` is already included:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Backend VPS Deployment

1. Upload the `server` folder to your VPS.
2. Install Node.js.
3. Run `npm install`.
4. Add `server/.env`.
5. Configure:

```env
REACHER_API_URL=https://your-reacher-api-domain.com
REACHER_API_KEY=
DATABASE_URL=your-database-url
VALIDATION_DELAY_MS=500
FRONTEND_URL=https://your-netlify-site.netlify.app
PORT=5000
```

Run with PM2:

```bash
npm install -g pm2
pm2 start server.js --name email-verifier-api
pm2 save
pm2 startup
```

## Nginx Reverse Proxy

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Add SSL:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

## Reacher API Configuration

Backend calls:

```http
POST {REACHER_API_URL}/v0/check_email
```

Request body:

```json
{
  "to_email": "test@example.com"
}
```

If `REACHER_API_KEY` exists, the backend sends:

```http
Authorization: Bearer ${REACHER_API_KEY}
```

The API key is never exposed to the frontend.

## API Endpoints

```text
POST /api/jobs/upload
GET /api/jobs
GET /api/jobs/:id
GET /api/jobs/:id/download
POST /api/verify/single
GET /api/settings
GET /api/settings/test
```

## CSV Download Columns

```text
original_email, normalized_email, status, is_reachable, syntax_valid, domain,
mx_accepts_mail, is_disposable, is_role_account, is_catch_all, reason, checked_at
```

## Final Deployment Flow

1. Build full project locally.
2. Push complete code to GitHub.
3. Connect GitHub repository to Netlify.
4. Deploy frontend on Netlify.
5. Deploy backend on VPS using PM2.
6. Add backend API URL in Netlify: `VITE_API_BASE_URL=https://api.yourdomain.com`.
7. Add Reacher API URL and API key in backend `.env` only.
8. Test CSV upload.
9. After upload, confirm redirect to Lists page.
10. Validate emails using Reacher API.
11. Download cleaned CSV.
