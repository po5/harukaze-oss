#!/bin/bash
pm2 start src/harukaze.js --watch --ignore-watch "node_modules" --ignore-watch "media" --ignore-watch "media/avatars" --ignore-watch "media/thumbnails" --ignore-watch ".git" --attach --no-daemon