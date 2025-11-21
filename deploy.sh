#!/bin/bash
VPS_IP="147.93.94.85"
TARGET_DIR="/root/feedly-proxy"

echo "Deploying to $VPS_IP..."

# Create directory
ssh root@$VPS_IP "mkdir -p $TARGET_DIR"

# Copy files
scp proxy.js package.json feedly-proxy.service root@$VPS_IP:$TARGET_DIR/

# Run setup on VPS
ssh root@$VPS_IP << 'EOF'
  set -e
  
  # Install Node.js if not present
  if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
  else
    echo "Node.js is already installed."
  fi

  cd /root/feedly-proxy

  # Install dependencies
  echo "Installing dependencies..."
  npm install

  # Setup Systemd
  echo "Configuring Systemd..."
  cp feedly-proxy.service /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable feedly-proxy
  systemctl restart feedly-proxy

  echo "Deployment complete! Proxy running on port 3000."
  echo "Test it with: curl http://localhost:3000/v3/profile"
EOF
