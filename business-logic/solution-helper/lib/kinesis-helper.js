"use strict";

let AWS = require("aws-sdk");

/**
 * Helper function to interact with Kinesis for cfn custom resource.
 *
 * @class kinesisHelper
 */
class kinesisHelper {
    /**
     * @class kinesisHelper
     * @constructor
     */
    constructor() {
        this.creds = new AWS.EnvironmentCredentials("AWS"); // Lambda provided credentials
        this.config = {
            credentials: this.creds,
            region: process.env.AWS_REGION,
        };
    }

    startKinesisAnalyticsApp(applicationName) {
        return new Promise((resolve, reject) => {
            let params = {
                ApplicationName: applicationName,
            };

            console.log(`Attempting to start Kinesis Analytics App: ${JSON.stringify(params)}`);
            let kda = new AWS.KinesisAnalyticsV2(this.config);

            kda.describeApplication(params, function (err, response) {
                if (err) {
                    console.log(JSON.stringify(err));
                    reject(err);
                } else {
                    if (response == null) {
                        console.log("The Kinesis Analytics application could not be found");
                        reject(err);
                    }
                    if (response.ApplicationDetail.ApplicationStatus === "READY") {
                        console.log("Starting Kinesis Analytics Application");
                        kda.startApplication(
                            {
                                ApplicationName: applicationName,
                                RunConfiguration: {
                                    SqlRunConfigurations: [
                                        {
                                            InputId: "1.1",
                                            InputStartingPositionConfiguration: {
                                                InputStartingPosition: "NOW",
                                            },
                                        },
                                    ],
                                },
                            },
                            function (err, response) {
                                if (err) {
                                    console.log(JSON.stringify(err));
                                    reject(err);
                                } else {
                                    console.log("Started Kinesis Analytics Application");
                                    resolve(response);
                                }
                            }
                        );
                    }
                }
            });
        });
    }
}

module.exports = kinesisHelper;
