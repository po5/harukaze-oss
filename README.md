# Harukaze

Harukaze is a CMS written in JavaScript, utilizing Koa, Prisma, and other libraries for maximum awesome (and maximum bloat)!!! Comissioned by Gutsybird!!

## Requirements
 - Node.js
 - npm (if you already have Node.js, you probably have this)
 - MySQL (or MariaDB)

## Setup
Install dependencies by running `npm install`.

Once you've done that, copy `example.env` to `.env`, and set the MySQL connection string.
Copy `config.example.json` to `config.json` and configure the server to your liking.

Next, run `npm install @prisma/client` then `npx prisma migrate deploy` to setup database stuff.

For development purposes, you can run `npx prisma db seed --preview-feature` to seed the database with example data.

## Running
Once everything is setup and configured, simply run `node .` in the same directory as the project, and it should be running!

For production deployments, you'll probably want to run Harukaze through something like pm2.

## Code Style
See `CODESTYLE.md`.