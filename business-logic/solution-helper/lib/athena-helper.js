'use strict';

let AWS = require('aws-sdk');

/**
 * Helper function to interact with Athena for cfn custom resource.
 *
 * @class athenaHelper
 */
class athenaHelper {
  /**
   * @class athenaHelper
   * @constructor
   */
  constructor() {
    this.creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
    this.config = {
      credentials: this.creds,
      region: process.env.AWS_REGION,
    };
  }
  
  createDefaultNamedQuery(database, name, workgroupName, description, queryString) {
    return new Promise((resolve, reject) => {
      let athena = new AWS.Athena(this.config);
      const params = {
        Database: database,
        Name: name,
        WorkGroup: workgroupName,
        Description: description,
        QueryString: queryString
      };
  
      athena.createNamedQuery(params, function(err, data) {
        if (err) {
          console.log(JSON.stringify(err));
          reject(err);
        } else {
          console.log(data);
          resolve(data);
        }
      });
    });
  }
}

module.exports = athenaHelper;
