# Testing Instructions

## Prerequisites
- Node.js >= 18.0
- MySQL or PostgreSQL / SQLite (for local rapid testing)
- npm or pnpm

## Steps

### 1. Backend Setup
The backend is configured to use SQLite for local development (file:./dev.db). The DATABASE_URL is already set in `backend/.env`.

If you wish to use MySQL, uncomment the MySQL line in `backend/.env` and comment the SQLite line.

### 2. Initialize Database
Run the following command to push the Prisma schema to the database (creates dev.db if using SQLite):

```bash
# Ensure you are in the project root
export DATABASE_URL=file:./dev.db   # (already set in backend/.env, but ensure it's exported)
npx prisma db push --schema=backend/prisma/schema.prisma
```

If you encounter an error about the query engine, you may need to delete temporary files:
```bash
rm -rf node_modules/.prisma/client/query_engine-windows.dll.node.tmp*
```
Then re-run the command.

### 3. Start Backend
```bash
npm run dev --prefix backend
```
The backend will run on http://localhost:5001 (as configured in backend/.env).

### 4. Start Frontend
```bash
npm run dev --prefix frontend
```
The frontend will run on http://localhost:5173 and proxy API requests to http://localhost:5001.

### 5. Open Application
Visit http://localhost:5173 in your browser.

## Default Seed Credentials
- Super Admin: admin@clinicflow.com / Admin@123
- Real Super Admin: superadmin@clinicflow.com / SuperAdmin@123
- Doctor 1: dr.raj@sharmaclinic.com / Doctor@123
- Doctor 2: dr.priya@sharmaclinic.com / Doctor@123
- Receptionist: reception@sharmaclinic.com / Reception@123

After signing in as Super Admin, open `/super-admin` and click **Add New Clinic** in the upper-right corner.

## Troubleshooting
- If the backend fails to start due to address already in use, ensure no other process is using port 5001. You can change the port in `backend/.env` and update the proxy target in `frontend/vite.config.ts` accordingly.
- If you encounter Prisma client generation errors, try deleting the `node_modules/.prisma/client` directory and re-running `npx prisma generate`.