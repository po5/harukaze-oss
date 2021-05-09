const config = require('../config.json');
const koa = require('koa');
const logger = require('koa-logger');
const app = new koa();

app.use(logger());

app.listen(config.server.port);