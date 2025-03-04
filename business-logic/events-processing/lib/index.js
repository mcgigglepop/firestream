'use strict';

/**
 * Lib
 */

const AWS = require('aws-sdk');
const NodeCache = require( 'node-cache');
const Event = require('./event.js');

/**
 * Applications table results cache
 * Maintains a local cache of registered Applications in DynamoDB. 
 */
global.applicationsCache = new NodeCache({stdTTL: process.env.CACHE_TIMEOUT_SECONDS, checkPeriod: 60, maxKeys: 1000, useClones: false});

const respond = async (event, context) => {
  let validEvents = 0;
  let invalidEvents = 0;
  let results = [];
  let _event = new Event();
  
  for (const record of event.records) {
    try {
      // Kinesis data is base64 encoded so decode here
      const payload = JSON.parse(Buffer.from(record.data, 'base64'));
      const processEvent = await _event.processEvent(payload, record.recordId, context);
      if (processEvent.result === 'Ok') {
        validEvents++;
      } else {
        invalidEvents++;
      }
      results.push(processEvent);
    } catch (err) {
      console.log(JSON.stringify(err));
      invalidEvents++;
      results.push({
        recordId: record.recordId,
        result: 'ProcessingFailed',
        data: record.data
      });
    }
  }
  console.log(JSON.stringify({
    'InputEvents': event.records.length,
    'EventsProcessedStatusOk': validEvents,
    'EventsProcessedStatusFailed': invalidEvents
  }));
  return Promise.resolve({
    records: results
  });
};

module.exports = {
  respond
};