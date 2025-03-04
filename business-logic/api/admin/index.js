'use strict';

const awsServerlessExpress = require('aws-serverless-express');
let app = require('./lib/app.js');

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  console.log(`Application admin service received event. ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
};