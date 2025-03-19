#!/bin/bash

# Define variables
BUILD_DIR="/home/ubuntu/voip-webapp/voip/dist"
TARGET_DIR="/var/www/html"

# Stop the script if any command fails
set -e

echo "Installing dependencies..."
cd ~/voip-webapp/voip
sudo npm install

echo "Building project..."
npm run build

echo "Clearing existing files in '$TARGET_DIR'..."
sudo rm -rf "$TARGET_DIR"/*

echo "Moving new build files to '$TARGET_DIR'..."
sudo mv "$BUILD_DIR"/* "$TARGET_DIR"/

echo "Build process completed. Files moved to '$TARGET_DIR'."

sudo systemctl restart nginx
sudo systemctl status nginx

echo "Restarted nginx"