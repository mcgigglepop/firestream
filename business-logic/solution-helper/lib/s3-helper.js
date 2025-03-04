'use strict';

let AWS = require('aws-sdk');

/**
 * Helper function to interact with S3 for cfn custom resource.
 *
 * @class s3Helper
 */
class s3Helper {
  /**
   * @class s3Helper
   * @constructor
   */
  constructor() {
    this.creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
  }
  
  getObject(s3Bucket, s3Key) {
    return new Promise((resolve, reject) => {
      try {
        let s3 = new AWS.S3({sslEnabled: true, signatureVersion: 'v4'});
        let params = {
          Bucket: s3Bucket,
          Key: s3Key
        };
        
        s3.getObject(params, function(err, data) {
          if (err) {
            console.log(JSON.stringify(err));
            reject(err);
          } else {
            var object = data.Body.toString();
            console.log(`Retrieved data from S3: ${JSON.stringify(object)}`);
            resolve(object);
          }
        });
      } catch (err) {
        console.log(JSON.stringify(err));
        reject(err);
      }
    });
  }
  
  uploadObject(s3Bucket, s3Key, objectBody) {
    console.log(`Uploading object to s3://${s3Bucket}/${s3Key}`);
    return new Promise((resolve, reject) => {
      let s3 = new AWS.S3({sslEnabled: true, signatureVersion: 'v4'});
      const params = {
        Body: objectBody,
        Bucket: s3Bucket,
        Key: s3Key,
        ServerSideEncryption: 'AES256'
      };
  
      s3.putObject(params, function(err, data) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(JSON.stringify(data));
          resolve(data);
        }
      });
    });
  }
}

module.exports = s3Helper;
