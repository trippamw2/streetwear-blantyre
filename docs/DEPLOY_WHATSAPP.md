# Whatomate Deployment Guide

## Option 1: Koyeb (Free Tier - Recommended)

### Step 1: Sign Up
1. Go to https://koyeb.com
2. Sign up with email (sometimes works without card)

### Step 2: Deploy Docker Image
1. Create new app → Docker
2. Image: `shridh0r/whatomate:latest`
3. Port: 8080
4. Add env vars:
   - `WHATOMATE_JWT_SECRET` = generate a secure random string

### Step 3: Access
- URL: https://your-app.koyeb.app
- Login: admin@admin.com / admin

---

## Option 2: Railway (Paid After Trial)

### Deploy
1. Go to https://railway.com/deploy/whatomate
2. Add card (required)
3. Deploy

### Cost: $5/month after free trial