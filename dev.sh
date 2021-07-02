#!/bin/bash
pm2 start src/harukaze.js --watch --ignore-watch "node_modules" --ignore-watch "media" --ignore-watch ".git" --attach --no-daemon