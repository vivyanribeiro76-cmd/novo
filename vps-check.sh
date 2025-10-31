#!/bin/bash
uname -a
cat /etc/os-release
node --version 2>/dev/null || echo "Node.js not installed"
nginx -v 2>/dev/null || echo "Nginx not installed"
