# 🚀 Deployment Guide: BizCollab ERP-CRM

This document explains how to host the BizCollab ecosystem "properly" on a Linux VPS (like DigitalOcean, AWS EC2, or Vultr) using the provided Docker configuration.

## 📋 Prerequisites
- A Linux VPS with [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
- A Domain Name (e.g., `erp.yourbusiness.com`) pointing to your VPS IP.

## 🛠️ Deployment Steps

### 1. Clone the repository
```bash
git clone <your-repo-url> bizcollab
cd bizcollab
```

### 2. Configure Environment Variables
Create a root `.env` file (this will be used by Docker Compose):
```bash
# Security
JWT_SECRET=your_super_secret_random_string_here

# Frontend Configuration (Not strictly needed if using Nginx proxy)
VITE_BACKEND_SERVER=/api/
```

### 3. Build and Start the Services
Run the following command to build the optimized production images and start the services in detached mode:
```bash
docker-compose up -d --build
```
This will start:
- **MongoDB**: Database on port 27017.
- **Backend/Frontend**: Bunedled app on port 8888.
- **Nginx**: Reverse proxy on port 80.

### 4. Verify the Deployment
- Check logs: `docker-compose logs -f`
- Access your site at: `http://your-vps-ip`

## 🔒 Securing with SSL (HTTPS)
To enable HTTPS, the easiest way is to use **Certbot** with Nginx.

1. Install Certbot on your host:
   ```bash
   sudo apt install certbot
   ```
2. STOP the nginx container temporarily:
   ```bash
   docker stop bizcollab-nginx
   ```
3. Get the SSL certificate:
   ```bash
   sudo certbot certonly --standalone -d erp.yourbusiness.com
   ```
4. Update `nginx.conf` to include the SSL certificate paths (usually `/etc/letsencrypt/live/...`) and mount them as volumes in `docker-compose.yml`.

## 📦 Maintenance
- **Update the app**:
  ```bash
  git pull
  docker-compose up -d --build
  ```
- **Backup Database**:
  ```bash
  docker-compose exec mongodb mongodump --out /data/db/backups/
  ```
