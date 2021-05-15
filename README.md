# Harukaze

Harukaze is a CMS written in JavaScript, utilizing Koa, Prisma, and other libraries for maximum awesome!!! Comissioned by Gutsybird!!

## Requirements
 - Node.js
 - npm (if you already have Node.js, you probably have this)
 - MySQL (or MariaDB)

## Setup
Install dependencies by running `npm install`.

Once you've done that, copy `example.env` to `.env`, and set the MySQL connection string.
Copy `config.example.json` to `config.json` and configure the server to your liking.

Next, run `npm install @prisma/client` then `npx prisma migrate deploy` to setup database stuff.

## Running
Once everything is setup and configured, simply run `node .` in the same directory as the project, and it should be running!

## Code Style
See `CODESTYLE.md`.