'use strict';

let AWS = require('aws-sdk');
const _ = require('underscore');

/**
 * Helper function to interact with dynamodb for cfn custom resource.
 *
 * @class dynamoDBHelper
 */
class dynamoDBHelper {
  /**
   * @class dynamoDBHelper
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
   * Save item to DynamoDB
   */
  saveItem(item, ddbTable) {
    // Handling Promise Rejection
    console.log(`Saving item to DynamoDB: ${JSON.stringify(item)}`);
    process.on('unhandledRejection', error => {
      throw error;
    });

    return new Promise((resolve, reject) => {
      for (var i = 0; i < _.keys(item).length; i++) {
        item[_.keys(item)[i]] = this._checkAssignedDataType(
          item[_.keys(item)[i]]
        );
      }

      let params = {
        TableName: ddbTable,
        Item: item
      };

      const docClient = new AWS.DynamoDB.DocumentClient(this.config);
      docClient.put(params, function (err, resp) {
        if (err) {
          console.log(JSON.stringify(err));
          reject(err);
        } else {
          console.log(`Item saved.`);
          resolve(item);
        }
      });
    });
  }

  _checkAssignedDataType(attr) {
    if (_.isObject(attr)) {
      if (_.has(attr, 'N')) {
        return parseInt(attr['N']);
      } else if (_.has(attr, 'B')) {
        return attr['B'] === 'true';
      } else {
        for (var i = 0; i < _.keys(attr).length; i++) {
          attr[_.keys(attr)[i]] = this._checkAssignedDataType(
            attr[_.keys(attr)[i]]
          );
        }
        return attr;
      }
    } else {
      return attr;
    }
  }
}

module.exports = dynamoDBHelper;
