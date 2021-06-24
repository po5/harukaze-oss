# Harukaze

Harukaze is a CMS (and optionally, booru) written in JavaScript, utilizing Koa, Knex, and other libraries for maximum awesome!!! Comissioned by Gutsybird!!

## Requirements
 - Node.js
 - npm (if you already have Node.js, you probably have this)
 - MySQL (or MariaDB)
 - FFmpeg

## Setup
Install dependencies by running `npm install`.

Copy `config.example.json` to `config.json` and configure the server to your liking.
Make sure to edit the field called `knex` in order to connect to the database.

Next, run `npx knex migrate:latest` to setup database stuff.

## Running
Once everything is setup and configured, simply run `node .` in the same directory as the project, and it should be running!

For production deployments, you'll probably want to run Harukaze through something like pm2.

## Code Style
See `CODESTYLE.md`.