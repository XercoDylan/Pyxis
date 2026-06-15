# Pyxis — Chocolate City Course Materials

A course materials sharing platform for MIT's Chocolate City organization. Members can browse, upload, and download lecture notes, problem sets, and exams organized by course and category.

## Features

- **Token-based authentication** — Admin pre-creates members with auto-generated access tokens
- **Course & category browsing** — Organized by course number with default categories (Exams, Problem Sets, Lectures)
- **File uploads** — Direct-to-S3 uploads via presigned URLs with progress tracking
- **File viewing** — Inline preview for PDFs and images, download for all formats
- **ZIP downloads** — Download entire categories or courses as ZIP archives
- **Member statistics** — Leaderboard showing top contributors
- **Admin panel** — Create/remove members, view tokens
- **Responsive design** — Black and gold Chocolate City theme, works on mobile

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Sessions:** Redis
- **File Storage:** AWS S3 (or S3-compatible like MinIO)

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- (Optional) MinIO for local file uploads

### Setup

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp server/.env.example server/.env
# Edit server/.env with your local values

# Run database migrations
cd server && npx prisma migrate deploy

# Seed an admin user
psql -d pyxis -c "INSERT INTO members (id, name, major, grade, token, is_admin, joined_at, last_login_at) VALUES (gen_random_uuid(), 'Admin', 'CS', 'Senior', 'YOURTOKEN', true, NOW(), NOW());"
```

### Run

```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user@localhost:5432/pyxis` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | S3 credentials | |
| `AWS_SECRET_ACCESS_KEY` | S3 credentials | |
| `S3_BUCKET_NAME` | S3 bucket for file uploads | `pyxis-files` |
| `S3_ENDPOINT` | Custom S3 endpoint (for MinIO) | `http://localhost:9000` |
| `SESSION_SECRET` | Secret for session cookies | Random string |
| `DEV_BYPASS_AUTH` | Skip auth in dev (`true`/`false`) | `false` |
| `NODE_ENV` | Environment | `development` or `production` |

## Deployment (Railway)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/pyxis.git
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Add **PostgreSQL** and **Redis** services
3. Railway auto-provides `DATABASE_URL` and `REDIS_URL`

### 3. Configure Build

In the service settings:
- **Build command:** `npm install && npm run build`
- **Start command:** `cd server && node dist/server.js`

### 4. Set Environment Variables

```
NODE_ENV=production
PORT=4000
DATABASE_URL=<provided by Railway>
REDIS_URL=<provided by Railway>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your AWS key>
AWS_SECRET_ACCESS_KEY=<your AWS secret>
S3_BUCKET_NAME=pyxis-files-prod
SESSION_SECRET=<random 64-char string>
DEV_BYPASS_AUTH=false
```

### 5. Set Up AWS S3

Create a bucket and add this CORS policy:
```json
[{
  "AllowedOrigins": ["https://your-domain.up.railway.app"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}]
```

### 6. Run Migrations

In Railway's shell:
```bash
cd server && npx prisma migrate deploy
```

### 7. Seed Admin User

Connect to Railway's PostgreSQL and run:
```sql
INSERT INTO members (id, name, major, grade, token, is_admin, joined_at, last_login_at)
VALUES (gen_random_uuid(), 'Your Name', 'Your Major', 'Senior', 'ADMINTOK', true, NOW(), NOW());
```

Log in with that token, then use the Admin panel to create more members.

## Project Structure

```
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── api/           # Axios API modules
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # React hooks (useAuth, useUpload)
│   │   ├── pages/         # Route page components
│   │   ├── styles/        # Tailwind theme
│   │   └── utils/         # Formatting & validation helpers
│   └── public/            # Static assets (logo)
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/        # Database, Redis, S3 clients
│   │   ├── middleware/    # Auth, error handling
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic
│   │   └── validators/    # Input validation
│   └── prisma/            # Schema & migrations
└── vitest.config.ts        # Test configuration
```

## License

Private — Chocolate City, MIT
