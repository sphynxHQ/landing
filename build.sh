#!/bin/bash
# Rebuild dist/ from source files. Run before every deploy.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp index.html 404.html _headers robots.txt dist/
cp -r assets dist/assets
echo "dist/ rebuilt: $(find dist -type f | wc -l) files"
