#!/bin/bash

# Env Vars
POSTGRES_SUPER_USER="postgres"
POSTGRES_USER="authenticator"
POSTGRES_SUPER_PASSWORD=$(openssl rand -base64 12)  # Generate a random 12-character password
POSTGRES_PASSWORD=$(openssl rand -base64 12)  # Generate a random 12-character password
POSTGRES_DB="mydb"
#SECRET_KEY=$(openssl rand -base64 32) # for the demo app
SECRET_KEY="Gra5tMn1La4KVMGgHHiOMq1Ir17WSAh0LHbz/AAl9n4="
NEXT_PUBLIC_SAFE_KEY="XXrOYg7U+HOvS6ivt+/d1C4OzZdIb3SdhRedKFE9gBs=" # for the demo app
DOMAIN_NAME="hero100era.us.kg" # replace with your own
EMAIL="eros.wang@gmail.com" # replace with your own

# Script Vars
REPO_URL="git@github.com:hero100era/iclass.git"
PROJECT_DIR=~/iclass
APP_DIR=frontend
BACKEND_DIR=backend
SWAP_SIZE="1G"  # Swap size of 1GB

# Update package list and upgrade existing packages
sudo apt update && sudo apt upgrade -y

# Add Swap Space
echo "Adding swap space..."
sudo fallocate -l $SWAP_SIZE /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Install Docker
sudo apt install apt-transport-https ca-certificate curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
sudo apt update
sudo apt install docker-ce -y
sudo apt install docker-compose -y

# Install Docker Compose
# sudo rm -f /usr/local/bin/docker-compose
# sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Wait for the file to be fully downloaded before proceeding
# if [ ! -f /usr/local/bin/docker-compose ]; then
#   echo "Docker Compose download failed. Exiting."
#   exit 1
# fi

# sudo chmod +x /usr/local/bin/docker-compose

# Ensure Docker Compose is executable and in path
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify Docker Compose installation
docker-compose --version
if [ $? -ne 0 ]; then
  echo "Docker Compose installation failed. Exiting."
  exit 1
fi

# Ensure Docker starts on boot and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Clone the Git repository
if [ -d "$PROJECT_DIR" ]; then
  echo "Directory $PROJECT_DIR already exists. Pulling latest changes..."
  cd $PROJECT_DIR && git pull
else
  echo "Cloning repository from $REPO_URL..."
  git clone $REPO_URL $PROJECT_DIR
  cd $PROJECT_DIR
fi

# For Docker internal communication ("db" is the name of Postgres container)
DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/$POSTGRES_DB"

# For external tools (like Drizzle Studio)
DATABASE_URL_EXTERNAL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"

# Create the .env file inside the app directory (next-app/.env)
echo "POSTGRES_SUPER_USER=$POSTGRES_SUPER_USER" > "$APP_DIR/.env"
echo "POSTGRES_SUPER_PASSWORD=$POSTGRES_SUPER_PASSWORD" >> "$APP_DIR/.env"
echo "POSTGRES_USER=$POSTGRES_USER" > "$APP_DIR/.env"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> "$APP_DIR/.env"
echo "POSTGRES_DB=$POSTGRES_DB" >> "$APP_DIR/.env"
echo "DATABASE_URL=$DATABASE_URL" >> "$APP_DIR/.env"
echo "DATABASE_URL_EXTERNAL=$DATABASE_URL_EXTERNAL" >> "$APP_DIR/.env"

# These are just for the demo of env vars
echo "SECRET_KEY=$SECRET_KEY" >> "$APP_DIR/.env"
echo "NEXT_PUBLIC_SAFE_KEY=$NEXT_PUBLIC_SAFE_KEY" >> "$APP_DIR/.env"

# Also load the variables to the current environment.
source $APP_DIR/.env

#Create the postgrerst.conf file inside the backend directory(backend/postgrest.conf)
echo "db-uri=$DATABASE_URL_EXTERNAL" > "$BACKEND_DIR/postgrest.conf"
echo "db-schemas=api" >> "$BACKEND_DIR/postgrest.conf"
echo "db-anon-role=anonymous" >> "$BACKEND_DIR/postgrest.conf"
echo "server-port=2000" >> "$BACKEND_DIR/postgrest.conf"
echo "jwt-secret=$SECRET_KEY" >> "$BACKEND_DIR/postgrest.conf"
echo "app.settings.jwt_secret=$SECRET_KEY" >> "$BACKEND_DIR/postgrest.conf"
echo "app.settings.jwt_expire_seconds=3600" >> "$BACKEND_DIR/postgrest.conf"

# Install Nginx
sudo apt install nginx -y

# Remove old Nginx config (if it exists)
sudo rm -f /etc/nginx/sites-available/myapp
sudo rm -f /etc/nginx/sites-enabled/myapp

# Stop Nginx temporarily to allow Certbot to run in standalone mode
sudo systemctl stop nginx

# Obtain SSL certificate using Certbot standalone mode
sudo apt install certbot -y
sudo certbot certonly --standalone -d $DOMAIN_NAME --non-interactive --agree-tos -m $EMAIL

# Ensure SSL files exist or generate them
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  sudo wget https://raw.githubusercontent.com/certbot/certbot/main/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf -P /etc/letsencrypt/
fi

if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

# Create Nginx config with reverse proxy, SSL support, rate limiting, and streaming support
sudo cat > /etc/nginx/sites-available/myapp <<EOL
limit_req_zone \$binary_remote_addr zone=mylimit:10m rate=10r/s;

server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Redirect all HTTP requests to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN_NAME;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Enable rate limiting
    limit_req zone=mylimit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;

        # Disable buffering for streaming support
        proxy_buffering off;
        proxy_set_header X-Accel-Buffering no;
    }
}
EOL

# Create symbolic link if it doesn't already exist
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp

# Restart Nginx to apply the new configuration
sudo systemctl restart nginx

# Build and run the Docker containers from the project directory (~/iclass-project)
sudo docker-compose up --build -d

# Check if Docker Compose started correctly
if ! sudo docker-compose ps | grep "Up"; then
  echo "Docker containers failed to start. Check logs with 'docker-compose logs'."
  exit 1
fi

# Output final message
echo "Deployment complete. Your Next.js app, the Postgrest backend and PostgreSQL database are now running. 
Next.js is available at https://$DOMAIN_NAME, and the PostgreSQL database is accessible from the web service.

The .env file has been created with the following values:
- POSTGRES_USER
- POSTGRES_PASSWORD (randomly generated)
- POSTGRES_DB
- DATABASE_URL
- DATABASE_URL_EXTERNAL
- SECRET_KEY
--------------------------------"
