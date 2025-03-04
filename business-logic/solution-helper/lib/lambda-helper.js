'use strict';

let AWS = require('aws-sdk');

/**
 * Helper function to interact with AWS Lambda API for cfn custom resource.
 *
 * @class lambdaHelper
 */
class lambdaHelper {
  /**
   * @class lambdaHelper
   * @constructor
   */
  constructor() {
    this.creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
    this.config = {
      credentials: this.creds,
      region: process.env.AWS_REGION,
    };
  }
  
  /**
   * Invoke Sync of Lambda Function
   */
  invokeFunctionSync(functionArn) {
    console.log(`Invoking Lambda Function: ${JSON.stringify(functionArn)}`);
    return new Promise((resolve, reject) => {
      try {
        const lambda = new AWS.Lambda(this.config);
        const params = {
          FunctionName: functionArn,
          InvocationType: 'RequestResponse'
        };
        
        lambda.invoke(params, function (err, data) {
          if (err) {
            console.log(JSON.stringify(err));
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (err) {
        console.log(JSON.stringify(err));
        reject(err);
      }
    });
  }
}

module.exports = lambdaHelper;
