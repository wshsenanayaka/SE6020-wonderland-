# Wonderland Node.js Microservices Backend

The React frontend talks to a Node.js API Gateway.

## Services

- `api-gateway` - public API entry point on port `8089`
- `auth-service` - login, logout, profile cookies on port `4001`
- `user-service` - visitor registration and visitor records on port `4002`
- `business-service` - platform data, bookings, activities, reports on port `4003`

Each service has its own:

- `package.json`
- `src/config.js`
- `src/routes`
- `src/controllers`
- `Dockerfile`

## Run With Docker

From this `backend` folder:

```bash
docker compose up --build
```

The API Gateway will run at:

```text
http://127.0.0.1:8089
```

## Run Locally Without Docker

Open four terminals.

```bash
cd backend/auth-service
npm install
npm run dev
```

```bash
cd backend/user-service
npm install
npm run dev
```

```bash
cd backend/business-service
npm install
npm run dev
```

```bash
cd backend/api-gateway
npm install
npm run dev
```

Then run the React frontend from `frontend`:

```bash
npm.cmd run dev
```

## Main API Gateway Routes

```text
GET  /api/platform-data
POST /api/auth/login
POST /api/auth/logout
POST /api/users/register
POST /api/business/bookings
POST /api/business/activities
```

The services use MySQL for persistence and store public images in `../frontend/public/assets`.
