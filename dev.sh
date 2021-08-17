#!/bin/bash
pm2 start src/harukaze.js --watch --ignore-watch "node_modules/ media/ media/avatars media/thumbnails media/moods .git config.json *.log" --attach --no-daemon