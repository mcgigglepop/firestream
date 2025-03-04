'use strict';
const moment = require('moment');
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();
const creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const cloudwatchConfig = {
	credentials: creds,
	region: process.env.AWS_REGION
};

/**
 * Process Kinesis Analytics output and publish to CloudWatch
 * @class CloudWatchMetrics
 */
class CloudWatchMetrics {
    constructor() {
        this.cloudwatchConfig = cloudwatchConfig;
    }
    
    /**
     * Publish metric to CloudWatch Metrics
     * @param {JSON} metric - the payload to send to Cloudwatch
     */
    async publishMetric(metric) {
        let namespace = `${process.env.CW_NAMESPACE}`;
        console.log(`Publishing metric: ${JSON.stringify(metric)}`);
        const params = {
            'MetricData': [metric],
            'Namespace': namespace
        };
        let data;
        try {
            data = await cloudwatch.putMetricData(params).promise();
            console.log(`cw response: ${JSON.stringify(data)}`);
        } catch (err) {
            console.log(`${JSON.stringify(err)}`);
            return Promise.reject(err);
        }
        return Promise.resolve(data);
    }
    
    /**
     * Convert a Kinesis Data Analytics output metric record into CloudWatch Metric format
     * @param {JSON} payload - input metric data record to be transformed
     */
    async buildMetric(payload) {
        let metric = {
            MetricName: payload.METRIC_NAME,
            Timestamp: moment(payload.METRIC_TIMESTAMP).unix(),
            Value: payload.METRIC_UNIT_VALUE_INT,
            Unit: payload.METRIC_UNIT || 'None'
        };
        
        // Extract dimensions from input, populate dimensions array in format required by CloudWatch
        // Strip DIMENSION_ prefix from metric before publishing
        let dimensions = [];
        for (var key in payload) {
        	if (key.includes('DIMENSION_') && (payload[key] !== null && payload[key] != "" && payload[key] != "null")) {
                dimensions.push({
                    'Name': key.split("DIMENSION_").pop(),
                    'Value': payload[key]
                });
        	}
        }
        if (dimensions.length > 0) {
            metric.Dimensions = dimensions;
        }
        return Promise.resolve(metric);
    }
}

module.exports = CloudWatchMetrics;