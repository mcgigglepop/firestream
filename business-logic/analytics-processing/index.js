'use strict';

/**
 * Lib
 */

let lib = require('./lib/process.js');

exports.handler = function(event, context, callback) {
  console.log(`Analytics Processing service received event`);

  lib
    .respond(event)
    .then(data => {
      return callback(null, data);
    })
    .catch(err => {
      return callback(err, null);
    });
};
