#!/bin/bash

# Define variables
BUILD_DIR="~/voip-webapp/voip/dist"
TARGET_DIR="/var/www/html"

# Stop the script if any command fails
set -e

echo "Installing dependencies..."
cd ~/voip-webapp/voip
npm install

echo "Building project..."
npm run build

# Check if the build was successful
if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory '$BUILD_DIR' not found. Exiting."
  exit 1
fi

echo "Clearing existing files in '$TARGET_DIR'..."
rm -rf "$TARGET_DIR"/*

echo "Moving new build files to '$TARGET_DIR'..."
mv "$BUILD_DIR"/* "$TARGET_DIR"/

echo "Build process completed. Files moved to '$TARGET_DIR'."

sudo systemctl restart nginx
sudo systemctl status nginx

echo "Restarted nginx"