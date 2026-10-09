# 🚀 Hostinger Deployment Guide for HomeSure Next.js Backend

This guide walks you through deploying the **HomeSure Next.js Backend** to **Hostinger** (using Hostinger VPS or Hostinger Cloud Node.js Hosting), configuring environment variables, setting up PM2 process manager, Nginx reverse proxy, and free SSL certificates with Let's Encrypt.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Option A: Deployment on Hostinger VPS (Recommended)](#option-a-deployment-on-hostinger-vps-recommended)
   - [Step 1: Connect via SSH](#step-1-connect-via-ssh)
   - [Step 2: Install Node.js & PM2](#step-2-install-nodejs--pm2)
   - [Step 3: Clone Code & Configure Env](#step-3-clone-code--configure-env)
   - [Step 4: Build & Start App with PM2](#step-4-build--start-app-with-pm2)
   - [Step 5: Configure Nginx & SSL](#step-5-configure-nginx--ssl)
3. [Option B: Deployment on Hostinger Web Hosting (Node.js Selector)](#option-b-deployment-on-hostinger-web-hosting-nodejs-selector)
4. [Setting up Domain & SSL](#setting-up-domain--ssl)
5. [Connecting Frontend to Production Backend](#connecting-frontend-to-production-backend)

---

## 📌 Prerequisites

- Hostinger Account (VPS Plan like KVM 1/2 or Cloud Hosting with Node.js support).
- Domain name pointed to Hostinger nameservers / VPS IP.
- Supabase Project Credentials.
- Xendit Live / Test API Keys.

---

## 🖥️ Option A: Deployment on Hostinger VPS (Recommended)

Hostinger VPS provides full control, allowing you to run Node.js apps seamlessly using **PM2** and **Nginx**.

### Step 1: Connect via SSH
Open your terminal (PowerShell or Bash) and connect to your Hostinger VPS:
```bash
ssh root@<YOUR_HOSTINGER_VPS_IP>
```

### Step 2: Install Node.js, NPM, and PM2
Run the following commands on your VPS:
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Verify installation
node -v
npm -v

# Install PM2 process manager globally
sudo npm install -g pm2
```

### Step 3: Clone Code & Configure Environment
```bash
# Navigate to web root
cd /var/www

# Clone your repository or upload project files
git clone https://github.com/your-username/homesure.git
cd homesure

# Install dependencies
npm install --production=false
```

Create production environment file:
```bash
nano .env.local
```

Paste your production variables:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

XENDIT_SECRET_KEY=xnd_production_your_key
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_production_your_key
XENDIT_WEBHOOK_VERIFICATION_TOKEN=your_production_webhook_token
```

Press `Ctrl + O`, `Enter` to save, and `Ctrl + X` to exit.

### Step 4: Build & Start App with PM2
```bash
# Build Next.js application
npm run build

# Start app with PM2
pm2 start npm --name "homesure-backend" -- start

# Save PM2 process list and configure auto-restart on boot
pm2 save
pm2 startup
```

### Step 5: Configure Nginx Reverse Proxy & SSL

Create Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/homesure
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/homesure /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Install Certbot for free SSL:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🌐 Option B: Deployment on Hostinger Web Hosting (Node.js Selector)

If using Hostinger Shared / Cloud hosting with hPanel:

1. Log into **Hostinger hPanel**.
2. Go to **Advanced** -> **Node.js**.
3. Click **Create Application**:
   - **Node.js Version**: Select `20.x` or latest.
   - **Application Mode**: `Production`.
   - **Application Root**: `homesure`.
   - **Application URL**: Select your domain.
   - **Application Startup File**: `node_modules/next/dist/bin/next` (Arguments: `start`).
4. Upload project files via File Manager or Git.
5. In hPanel **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `XENDIT_SECRET_KEY`, etc.
6. Open **Terminal** in hPanel, run:
   ```bash
   npm install
   npm run build
   ```
7. Click **Restart Application**.

---

## 🔗 Connecting Frontend to Production Backend

Once deployed to Hostinger (`https://yourdomain.com`):

1. Include `assets/js/api-client.js` in your HTML pages:
   ```html
   <script src="/assets/js/api-client.js"></script>
   ```
2. Update Xendit webhook callback URL to:
   `https://yourdomain.com/api/payments/webhook`
3. Update Supabase Auth site URL to:
   `https://yourdomain.com`
