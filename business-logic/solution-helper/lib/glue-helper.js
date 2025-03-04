'use strict';

let AWS = require('aws-sdk');

/**
 * Helper function to interact with Glue for cfn custom resource.
 *
 * @class glueHelper
 */
class glueHelper {
  /**
   * @class glueHelper
   * @constructor
   */
  constructor() {
    this.creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
    this.config = {
      credentials: this.creds,
      region: process.env.AWS_REGION,
    };
  }
  
  putDataCatalogEncryptionSettings(catalogId, catalogEncryptionMode) {
    return new Promise((resolve, reject) => {
      let glue = new AWS.Glue(this.config);
      const params = {
        DataCatalogEncryptionSettings: {
          ConnectionPasswordEncryption: {
            ReturnConnectionPasswordEncrypted: true
          },
          EncryptionAtRest: {
            CatalogEncryptionMode: catalogEncryptionMode
          }
        },
        CatalogId: catalogId 
      };
      
      glue.putDataCatalogEncryptionSettings(params, function(err, data) {
        if (err) {
          if (err.code === 'AlreadyExistsException') {
            console.log(`Encryption setting already exists for ${catalogId}, skipping`);
            resolve();
          }
          console.log(JSON.stringify(err));
          reject(err);
        } else {
          console.log(`Saved Glue encryption setting for ${catalogId}`);
          resolve(data);
        }
      });
    });
  }
}

module.exports = glueHelper;
