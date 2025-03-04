'use strict';

const https = require('https');

// Metrics class for sending usage metrics to solution endpoints
class Metrics {
  constructor() {
    this.endpoint = 'https://metrics.awssolutionsbuilder.com/generic';
  }
  
  async sendAnonymousMetric(metric) {
    console.log('RESPONSE BODY:\n', responseBody); 
    const parsedUrl = url.parse(event.ResponseURL); 
    const options = { 
        hostname: this.endpoint, 
        port: 443,
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json', 
            'Content-Length': metric.length, 
        } 
    }; 
 
    const req = https.request(options, (res) => { 
        console.log('STATUS:', res.statusCode); 
        console.log('HEADERS:', JSON.stringify(res.headers)); 
        callback(null, 'Successfully sent stack response!'); 
    }); 
 
    req.on('error', (err) => { 
        console.log('sendResponse Error:\n', err); 
        callback(err); 
    }); 
 
    req.write(JSON.stringify(metric)); 
    req.end();
  }
}

module.exports = Metrics;
