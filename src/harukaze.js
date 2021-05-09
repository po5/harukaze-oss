const koa = require('koa');
const logger = require('koa-logger');
const app = new koa();

app.use(logger());

app.listen(8080);
