# MediNovel — Deployment Guide for MilesWeb / VPS Server

This document outlines the step-by-step production deployment process for hosting MediNovel on a standard Linux VPS or MilesWeb hosting environment without requiring containerization.

---

## 1. Prerequisites on the Host Server
- **Node.js**: v18.x or v20.x LTS
- **Package Manager**: npm or pnpm
- **Database**: MySQL 8.0+ or MariaDB 10.5+
- **Process Manager**: PM2 (`npm install -g pm2`)
- **Web Server**: Nginx or Apache with reverse proxy support
- **SSL**: Let's Encrypt / Certbot

---

## 2. Architecture Layout on Server

- **Domain mapping**:
  - `app.yourdomain.com` $\rightarrow$ React SPA Static Files (`/var/www/MediNovel/frontend/dist`)
  - `api.yourdomain.com` $\rightarrow$ Reverse Proxy to Node.js backend port `5000` (`http://127.0.0.1:5000`)

---

## 3. Deployment Steps

### Step 1: Clone and Configure Environment Variables
Create `/var/www/MediNovel/backend/.env`:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://clinicuser:SecurePass123!@localhost:3306/MediNovel_db"
JWT_SECRET="YOUR_SUPER_LONG_RANDOM_JWT_SECRET_KEY_MIN_32_CHARS"
JWT_REFRESH_SECRET="YOUR_SUPER_LONG_RANDOM_REFRESH_SECRET_KEY"
CORS_ORIGIN="https://app.yourdomain.com"
```

Create `/var/www/MediNovel/frontend/.env.production`:
```env
VITE_API_URL="https://api.yourdomain.com/api"
```

### Step 2: Install Dependencies & Run Database Migrations
```bash
# Backend Setup
cd /var/www/MediNovel/backend
npm install --production=false
npx prisma migrate deploy
npm run build

# Optional: Run seed if initial bootstrap is needed
npx ts-node prisma/seed.ts
```

### Step 3: Build Frontend
```bash
cd /var/www/MediNovel/frontend
npm install
npm run build
```

### Step 4: Configure PM2 for Backend
```bash
cd /var/www/MediNovel/backend
pm2 start dist/server.js --name "MediNovel-api"
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

**1. API Reverse Proxy (`/etc/nginx/sites-available/api.yourdomain.com`)**:
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**2. Frontend SPA (`/etc/nginx/sites-available/app.yourdomain.com`)**:
```nginx
server {
    server_name app.yourdomain.com;
    root /var/www/MediNovel/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

### Step 6: Enable HTTPS
```bash
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

### Step 7: Verify Health Check
```bash
curl -I https://api.yourdomain.com/api/health
# Response: HTTP/2 200, {"success":true,"status":"ok"}
```
