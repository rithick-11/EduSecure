#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
#  EduSecure — AWS Ubuntu 22.04 Deployment Script
#  Run this script ONCE on a fresh EC2 instance:
#      chmod +x deploy.sh && sudo bash deploy.sh
# ═══════════════════════════════════════════════════════════════════════

set -e  # Exit immediately on any error

# ── CONFIGURATION ────────────────────────────────────────────────────
# !! EDIT THESE BEFORE RUNNING !!
GITHUB_REPO="https://github.com/YOUR_USERNAME/EduSecure.git"   # ← your GitHub URL
EC2_PUBLIC_IP="$(curl -s http://checkip.amazonaws.com)"        # auto-detected
APP_DIR="/home/ubuntu/EduSecure"
BACKEND_PORT=8000
FRONTEND_PORT=3000

echo "============================================================"
echo "  EduSecure Deployment — EC2 IP: $EC2_PUBLIC_IP"
echo "  Backend  → http://$EC2_PUBLIC_IP:$BACKEND_PORT"
echo "  Frontend → http://$EC2_PUBLIC_IP:$FRONTEND_PORT"
echo "============================================================"

# ── STEP 1: System Updates ───────────────────────────────────────────
echo ""
echo "[1/8] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y git python3.11 python3.11-venv python3-pip curl build-essential

# ── STEP 2: Install Node.js 18 ───────────────────────────────────────
echo ""
echo "[2/8] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g serve          # static file server for React

# ── STEP 3: Clone Repository ─────────────────────────────────────────
echo ""
echo "[3/8] Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "Directory exists — pulling latest changes..."
    cd "$APP_DIR" && git pull
else
    git clone "$GITHUB_REPO" "$APP_DIR"
fi
chown -R ubuntu:ubuntu "$APP_DIR"

# ── STEP 4: Backend Setup ────────────────────────────────────────────
echo ""
echo "[4/8] Setting up Python virtual environment and installing dependencies..."
cd "$APP_DIR/backend"

python3.11 -m venv "$APP_DIR/venv"
source "$APP_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt

# Create DB directory
mkdir -p /var/lib/edusecure
chown ubuntu:ubuntu /var/lib/edusecure

# ── STEP 5: Backend .env ─────────────────────────────────────────────
echo ""
echo "[5/8] Generating production .env for backend..."

SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FERNET_SECRET=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

cat > "$APP_DIR/backend/.env" <<EOF
DATABASE_URL=sqlite:////var/lib/edusecure/edusecure.db
SECRET_KEY=$SECRET_KEY
FERNET_SECRET=$FERNET_SECRET
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
EOF

chown ubuntu:ubuntu "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"
echo "  ✅ .env generated with strong random keys"

# ── STEP 6: Frontend Build ───────────────────────────────────────────
echo ""
echo "[6/8] Building React frontend..."
cd "$APP_DIR/frontend"

# Write frontend .env with EC2 backend URL
cat > "$APP_DIR/frontend/.env.production" <<EOF
VITE_API_BASE_URL=http://$EC2_PUBLIC_IP:$BACKEND_PORT
EOF

npm install
npm run build
echo "  ✅ Frontend built — dist/ folder ready"

# ── STEP 7: Install systemd Services ────────────────────────────────
echo ""
echo "[7/8] Installing systemd services..."

# Backend service
cp "$APP_DIR/backend/edusecure-backend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable edusecure-backend
systemctl restart edusecure-backend
echo "  ✅ Backend service started on port $BACKEND_PORT"

# Frontend service
cp "$APP_DIR/frontend/edusecure-frontend.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable edusecure-frontend
systemctl restart edusecure-frontend
echo "  ✅ Frontend service started on port $FRONTEND_PORT"

# ── STEP 8: Open Firewall Ports ──────────────────────────────────────
echo ""
echo "[8/8] Configuring firewall (ufw)..."
ufw allow 22/tcp      # SSH
ufw allow $BACKEND_PORT/tcp
ufw allow $FRONTEND_PORT/tcp
ufw --force enable
echo "  ✅ Ports 22, $BACKEND_PORT, $FRONTEND_PORT open"

# ── DONE ─────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  ✅ EduSecure deployment COMPLETE!"
echo ""
echo "  🔗 Frontend:  http://$EC2_PUBLIC_IP:$FRONTEND_PORT"
echo "  🔗 Backend:   http://$EC2_PUBLIC_IP:$BACKEND_PORT"
echo "  🔗 API Docs:  http://$EC2_PUBLIC_IP:$BACKEND_PORT/docs"
echo ""
echo "  Check service status:"
echo "    sudo systemctl status edusecure-backend"
echo "    sudo systemctl status edusecure-frontend"
echo ""
echo "  View logs:"
echo "    sudo journalctl -u edusecure-backend -f"
echo "    sudo journalctl -u edusecure-frontend -f"
echo "============================================================"
