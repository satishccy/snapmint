# Snap Mint Prints Backend

Express + TypeScript backend API for Snap Mint Prints application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `server` directory:
```env
DATABASE_URL="mysql://user:password@localhost:3306/snap_mint_prints"
JWT_SECRET=your-secret-key-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=3001
FRONTEND_URL=http://localhost:5173
```

3. Setup Prisma:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the server:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the PORT specified in `.env`).

## API Endpoints

### Public Endpoints

- `POST /print-request` - Create a print request
  - Body: `{ wallet_address: string, asset_id: number }`
  - Returns: Created print request

- `GET /check-print-request/:wallet_address` - Check if wallet has a print request
  - Returns: Print request object or 404

- `GET /print-request` - Get all print requests (public, paginated)
  - Query params: `page`, `limit`
  - Returns: Paginated list of print requests

### Admin Endpoints (Require Bearer Token)

- `POST /admin-login` - Admin login
  - Body: `{ username: string, password: string }`
  - Returns: `{ token: string }` (also sets httpOnly cookie)

- `GET /admin/print-request` - Get all print requests (admin, paginated)
  - Headers: `Authorization: Bearer <token>`
  - Query params: `page`, `limit`
  - Returns: Paginated list of print requests

- `PATCH /print-request/:id` - Update print request status
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ status: "pending" | "in_progress" | "completed" | "collected" }`
  - Returns: Updated print request

## Database Schema

- `print_requests` table:
  - `id` (UUID)
  - `wallet_address` (string, indexed)
  - `asset_id` (string)
  - `status` (enum: pending, in_progress, completed, collected)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

