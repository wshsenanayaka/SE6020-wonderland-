# Wonderland React Frontend

This folder contains the React frontend for the Wonderland project.

The Node.js microservices application is now the backend:

- `../backend/api-gateway` exposes the public API Gateway.
- `../backend/auth-service` handles login/logout.
- `../backend/user-service` handles visitor registration.
- `../backend/business-service` handles platform data, bookings, and activities.

## Run Locally

Start the Node.js backend from the `backend` folder:

```bash
docker compose up --build
```

Start the React frontend from this folder:

```bash
npm install
npm run dev
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies `/api` and `/assets` requests to the Node API Gateway at `http://127.0.0.1:8089`.

If the API Gateway runs on a different URL, create a `.env` file in this folder:

```text
VITE_API_GATEWAY_URL=http://127.0.0.1:8089
```

Restart `npm.cmd run dev` after changing `.env`.
