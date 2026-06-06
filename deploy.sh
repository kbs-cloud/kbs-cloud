#!/bin/bash
# Exit on error
set -e

DEPLOY_DIR="/servers/cloud"
REPO_DIR="/home/gemini/repos/kbs-cloud/kbs-cloud"

# Find Node.js path (default to NVM directory if not in current PATH)
NODE_EXEC=$(which node || echo "/home/gemini/.nvm/versions/node/v24.16.0/bin/node")
NODE_BIN=$(dirname "$NODE_EXEC")

echo "=== Starting KBS Cloud Hub Deployment ==="
echo "Node binary directory: $NODE_BIN"

# Ensure Node directory is at the front of PATH so npm works correctly
export PATH="$NODE_BIN:$PATH"

# Build the project
echo "Building project in $REPO_DIR..."
cd "$REPO_DIR"
npm run build

# Prepare deploy folder
echo "Preparing deploy folder at $DEPLOY_DIR..."
if [ ! -d "$DEPLOY_DIR" ]; then
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown -R gemini:gemini "$DEPLOY_DIR"
fi

# Copy built files and package files
echo "Copying files to $DEPLOY_DIR..."
mkdir -p "$DEPLOY_DIR/dist"

cp -R dist/* "$DEPLOY_DIR/dist/"
cp server.cjs db.cjs "$DEPLOY_DIR/"
cp package.json package-lock.json "$DEPLOY_DIR/"

# Create production .env if it doesn't exist
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "Creating default production .env..."
    echo "FRONTEND_PORT=19000" > "$DEPLOY_DIR/.env"
    echo "BACKEND_PORT=20000" >> "$DEPLOY_DIR/.env"
    echo "AUTH_SERVER_URL=http://localhost:20001" >> "$DEPLOY_DIR/.env"
    echo "JWT_SECRET=kbs-cloud-hub-secret-key-98765" >> "$DEPLOY_DIR/.env"
fi

# Install production dependencies
echo "Installing production node modules in $DEPLOY_DIR..."
cd "$DEPLOY_DIR"
npm ci --omit=dev

# Write systemd service file
echo "Configuring systemd service..."
SERVICE_FILE="/etc/systemd/system/kbs-cloud.service"

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=KBS Cloud Game Hub Service
After=network.target

[Service]
Type=simple
User=gemini
WorkingDirectory=$DEPLOY_DIR
ExecStart=$NODE_BIN/node server.cjs
Restart=always
Environment=NODE_ENV=production BACKEND_PORT=20000 FRONTEND_PORT=19000
EnvironmentFile=/etc/environment
Environment="PATH=$NODE_BIN:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=multi-user.target
EOF

# Reload and restart service
echo "Reloading systemd and restarting kbs-cloud service..."
sudo systemctl daemon-reload
sudo systemctl enable kbs-cloud
sudo systemctl restart kbs-cloud

echo "=== Deployment Finished Successfully ==="
