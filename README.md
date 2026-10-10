# Wonderland Theme Park Platform

Wonderland is a cloud-native theme park web platform for attraction discovery, visitor registration, ticket booking, online payment, QR check-in, and administrator visibility into park operations.

The project uses a React frontend with a Node.js microservices backend, MySQL persistence, Stripe sandbox payment, QR code generation, email notifications, and Swagger API documentation.

## Project Structure

```text
wonderland/
  backend/
    api-gateway/        Public API gateway and Swagger docs
    auth-service/       Visitor/admin login, logout, session cookies
    user-service/       Visitor registration and profile APIs
    business-service/   Attractions, tickets, bookings, Stripe, email, QR, live park info
    docker-compose.yml
    package.json        Runs all backend services together
  frontend/
    public/assets/      Public images and uploaded activity assets
    src/                React pages, components, services, styles
    package.json
  db_note               MySQL table creation notes
```

## Technology Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express microservices
- API Gateway: Express proxy plus Swagger UI
- Database: MySQL
- Payment: Stripe Sandbox Checkout
- Email: Nodemailer SMTP
- QR Code: `qrcode`
- Authentication: Cookie-based visitor/admin profile sessions

## Microservices

| Service | Port | Purpose |
| --- | ---: | --- |
| API Gateway | `8089` | Public entry point, proxies `/api`, serves `/assets`, exposes Swagger |
| Auth Service | `4001` | Visitor/admin login, logout, session profile cookies |
| User Service | `4002` | Visitor registration, visitor profile, visitor list |
| Business Service | `4003` | Attractions, ticket passes, bookings, Stripe, QR check-in, email, live park info |

## Main Features

### Visitor Features

- Browse theme park attractions by category.
- View ticket pass cards from database.
- Register a visitor account.
- Login as a visitor.
- Select a ticket pass from `Choose Your Adventure`.
- Auto-fill full name, email address, and contact number after login.
- Book a visit with:
  - visit date
  - preferred time slot
  - ticket type
  - quantity
  - contact number
- Confirm booking with SweetAlert.
- Redirect to Stripe Sandbox payment.
- After payment success:
  - booking is marked paid/booked
  - QR token is generated
  - QR email can be sent
- Visitor dashboard shows:
  - booking count
  - paid count
  - pending count
  - arrived count
  - ticket count
  - charts for ticket/payment/arrival mix
  - personal booking details
  - QR download
  - resend booking email
  - profile update

### Administrator Features

- Login as administrator.
- Admin dashboard with different UI from visitor dashboard.
- View all visitor booking analytics:
  - total bookings
  - unique visitors
  - paid bookings
  - pending payments
  - arrived visitors
  - tickets sold
  - paid revenue
  - live attractions
- Dashboard charts:
  - bookings by ticket type
  - paid vs pending
  - arrived vs not arrived
  - paid revenue by ticket
- Manage attractions:
  - category
  - ride type
  - activity name
  - duration
  - requirement
  - background image
  - icon
  - color
  - zone
  - wait minutes
  - hourly capacity
  - operating status
  - visible/disabled switch
- Manage ticket passes:
  - ticket tier
  - guests
  - currency
  - ticket price
  - effective price per guest
  - create/update/delete
- View all visitor bookings with search/filter.
- Manage live park information:
  - admin controls Avg Wait Time
  - admin controls Ride Uptime
  - Visitors In Park is calculated from QR check-ins
  - Tickets Today is calculated from paid bookings for today
  - behaviour mix is calculated from paid ticket counts

### QR Check-In Flow

1. Visitor completes Stripe payment.
2. Booking receives a secure `qr_token`.
3. QR code contains:

```text
/check-in/{bookingId}?token={qr_token}
```

4. Park staff scans the QR code.
5. React check-in page calls:

```text
POST /api/business/bookings/{bookingId}/check-in
```

6. Backend validates:
   - booking exists
   - QR token matches
   - payment is paid
   - booking is not already arrived
7. Booking updates to:

```text
booking_status = Arrived
checkin_status = Arrived
arrived_at = NOW()
```

## Live Park Information

The public `Wonderland Today` section is not hardcoded.

Automatic values:

- Visitors In Park: calculated from today’s QR check-ins.
- Tickets Today: calculated from paid ticket quantity for today’s visit date.
- Behaviour Mix: calculated from paid ticket quantities grouped by ticket type.

Admin controlled values:

- Avg Wait Time
- Ride Uptime

Admin can update these from:

```text
Dashboard -> Live Park Info
```

## Payment Flow

The system uses Stripe Sandbox Checkout.

Booking flow:

1. Visitor submits booking.
2. Backend saves booking as pending.
3. Backend creates Stripe Checkout session.
4. Visitor is redirected to Stripe.
5. Stripe redirects to:

```text
/payment-success?session_id={CHECKOUT_SESSION_ID}
```

6. Frontend confirms session with backend.
7. Backend checks Stripe payment status.
8. Booking becomes paid/booked.
9. QR email is sent if SMTP is configured.

## Email Features

- Booking confirmation email after paid payment.
- QR code attached to email.
- Visitor dashboard includes resend email option.
- If SMTP is not configured, booking still succeeds and email can be retried later.

## Swagger API Documentation

After starting the backend, open:

```text
http://127.0.0.1:8089/api-docs
```

OpenAPI JSON:

```text
http://127.0.0.1:8089/api-docs/openapi.json
```

## Main API Routes

```text
GET    /api/platform-data

POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

POST   /api/users/register
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/visitors

POST   /api/business/bookings
POST   /api/business/bookings/:id/check-in
POST   /api/business/bookings/:id/resend-email
POST   /api/business/stripe/confirm-session

POST   /api/business/activities
PUT    /api/business/live-park-info

GET    /api/business/ticket-passes
POST   /api/business/ticket-passes
PUT    /api/business/ticket-passes/:id
DELETE /api/business/ticket-passes/:id
```

## Database Tables

Main tables:

- `visitors_tb`
- `administrators_tb`
- `activities_tb`
- `ticket_passes_tb`
- `ticket_bookings_tb`
- `park_operations_tb`
- `behaviour_mix_tb`

The SQL notes are in:

```text
db_note
```

The services also create/migrate required tables automatically when running.

## Environment Variables

Create `.env` files inside the backend services if needed.

Common database values:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=wonderland_db
FRONTEND_ORIGIN=http://127.0.0.1:5173
```

Business service payment and email values:

```text
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=http://127.0.0.1:5173/payment-success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://127.0.0.1:5173/payment-cancel

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_FROM=Wonderland Theme Park <no-reply@wonderland.local>
```

Auth service admin values:

```text
DEFAULT_ADMIN_EMAIL=admin@wonderland.com
DEFAULT_ADMIN_HASH=your_password_hash
```

Do not commit real secret keys to GitHub.

## Run Locally

Install backend service dependencies:

```powershell
cd backend
npm.cmd install
npm.cmd run install:services
```

Run all backend services in one command:

```powershell
cd backend
npm.cmd run dev
```

The API Gateway runs at:

```text
http://127.0.0.1:8089
```

Install and run frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Docker Backend

From the backend folder:

```powershell
cd backend
docker compose up --build
```

## CI/CD and AWS Deployment

The project includes a GitHub Actions CI/CD pipeline and AWS CloudFormation automation for ECR, ECS Fargate, RDS MySQL, S3, CloudFront, CloudWatch, Secrets Manager, and networking.

Read the setup and security instructions in [docs/CI-CD.md](docs/CI-CD.md).

The opt-in EKS/EC2/Kubernetes migration, cost estimate, approval gate, verification commands, and ECS retirement plan are in [docs/EKS-MIGRATION.md](docs/EKS-MIGRATION.md).

## Default Login

Administrator:

```text
Email: admin@wonderland.com
Password: admin123
```

Visitor:

```text
Register from the Register page, then login as Visitor Profile.
```

## Build Frontend

```powershell
cd frontend
npm.cmd run build
```

## Notes

- Public assets are served from `frontend/public/assets`.
- Uploaded attraction images are stored under `frontend/public/assets/images/activities`.
- Frontend requests `/api` and `/assets` through the API Gateway.
- Admin-only routes are protected using the profile type cookie.
- Visitor-only routes check the visitor profile cookie and email.
