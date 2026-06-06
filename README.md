# KBS Cloud Hub

KBS Cloud Hub is the central portal for kbs-cloud.com, providing a responsive sci-fi glassmorphic dashboard to discover and play games like Star-Swarm and Ticker Clash. It handles user sessions and integrates with the KBS Auth Single Sign-On (SSO) service.

## Features

- **Central Dashboard:** Discover, learn about, and launch sci-fi & strategy games.
- **SSO Authentication:** Sign in securely via KBS Auth SSO.
- **Responsive Design:** Mobile-first sci-fi glassmorphic UI.
- **Dual-Port Serving:** Custom static and API proxying architecture.

## Port Assignments

- **Frontend (Target):** `19000` (development via Vite, proxied to `20000`)
- **Backend (Target):** `20000` (Express production backend)

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local development (runs both frontend and backend concurrently):
   ```bash
   npm run dev
   ```

## Deployment

Deploy the application to the production server:
```bash
./deploy.sh
```
