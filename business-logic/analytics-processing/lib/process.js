'use strict';

/**
 * This function processes outputs from Kinesis Data Analytics. 
 */
const AWS = require('aws-sdk');
const CloudwatchMetrics = require('./cloudwatch.js');

const respond = async event => {
	let success = 0;
	let failure = 0;
	let kinesisAnalyticsErrors = 0;
	let cloudwatch = new CloudwatchMetrics();
	let results = [];
	for (const record of event.records) {
		try {
			const payload = JSON.parse(Buffer.from(record.data, 'base64'));
			if (payload.OUTPUT_TYPE === 'metrics') {
				let metric = await cloudwatch.buildMetric(payload);
				await cloudwatch.publishMetric(metric)
				.then(data => {
					success++;
					results.push({
						recordId: record.recordId,
						result: 'Ok'
					});
				});
				
			} else if (payload.ERROR_NAME) {
				// Log errors from Kinesis Analytics error_stream - https://docs.aws.amazon.com/kinesisanalytics/latest/dev/error-handling.html
				// Treat as successfully handled record. Alarming on KDA errors can be handled in Cloudwatch with metric filter on kinesisAnalyticsErrors
				console.log(`Kinesis Data Analytics Error: ${JSON.stringify(payload)}`);
				kinesisAnalyticsErrors++;
				success++;
				results.push({
					recordId: record.recordId,
					result: 'Ok'
				});
			} else {
				// Records that are not tagged "metrics" are treated as delivery errors
				console.log(`Record does not contain OUTPUT_TYPE of metric`);
				failure++;
				results.push({
					recordId: record.recordId,
					result: 'Ok'
				});
			}
		} catch (err) {
			console.log(JSON.stringify(err));
			failure++;
			results.push({
				recordId: record.recordId,
				result: 'DeliveryFailed'
			});
		}
		
	}
	
	console.log(JSON.stringify({
		'SuccessfulRecords': success,
		'FailedRecords': failure,
		'KinesisAnalyticsErrors': kinesisAnalyticsErrors
	}));
	return Promise.resolve({
		records: results
	});
};

module.exports = {
	respond
};



