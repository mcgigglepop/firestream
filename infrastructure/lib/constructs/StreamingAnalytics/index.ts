import * as cdk from "aws-cdk-lib";
import * as kinesisanalytics from "aws-cdk-lib/aws-kinesisanalytics";
import * as customresources from "aws-cdk-lib/custom-resources";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as kinesis from "aws-cdk-lib/aws-kinesis";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as fs from "fs";

import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

const inputSchema: kinesisanalytics.CfnApplication.InputSchemaProperty = {
  recordColumns: [
    {
      name: "event_version",
      sqlType: "VARCHAR(8)",
      mapping: "$.event.event_version",
    },
    {
      name: "event_id",
      sqlType: "VARCHAR(64)",
      mapping: "$.event.event_id",
    },
    {
      name: "event_timestamp",
      sqlType: "BIGINT",
      mapping: "$.event.event_timestamp",
    },
    {
      name: "event_type",
      sqlType: "VARCHAR(64)",
      mapping: "$.event.event_type",
    },
    {
      name: "app_version",
      sqlType: "VARCHAR(8)",
      mapping: "$.event.app_version",
    },
    {
      name: "level_id",
      sqlType: "VARCHAR(64)",
      mapping: "$.event.event_data.level_id",
    },
    {
      name: "country_id",
      sqlType: "VARCHAR(64)",
      mapping: "$.event.event_data.country_id",
    },
    {
      name: "spell_id",
      sqlType: "VARCHAR(64)",
      mapping: "$.event.event_data_spell_id",
    },
    {
      name: "application_id",
      sqlType: "VARCHAR(64)",
      mapping: "$.application_id",
    },
    {
      name: "last_login_time",
      sqlType: "BIGINT",
      mapping: "$.event.event_data.last_login_time",
    },
    {
      name: "currency_type",
      sqlType: "VARCHAR(64)",
      mapping: "$.event.event_data.currency_type",
    },
    {
      name: "currency_amount",
      sqlType: "DOUBLE",
      mapping: "$.event.event_data.currency_amount",
    },
  ],
  recordFormat: {
    recordFormatType: "JSON",
    mappingParameters: {
      jsonMappingParameters: {
        recordRowPath: "$",
      },
    },
  },
};

interface StreamingAnalyticsConstructProps{
  baseCodePath: string;
  gameEventsStream: kinesis.IStream;
  solutionHelper: lambda.IFunction;
  solutionHelperProvider: customresources.Provider;
}

export class StreamingAnalyticsConstruct extends Construct {
  public readonly analyticsProcessingFunction: NodejsFunction;
  public readonly kinesisAnalyticsApp: kinesisanalytics.CfnApplication;

  constructor(scope: Construct, id: string, props: StreamingAnalyticsConstructProps) {
    super(scope, id);

    const codePath = `../../${props.baseCodePath}`;

    const analyticsProcessingFunction = new NodejsFunction(
      this,
      "AnalyticsProcessingFunction",
      {
        description:
          "Consumes outputs from Kinesis Data Analytics application for processing",
        entry: path.join(
          __dirname,
          `${codePath}/analytics-processing/index.js`
        ),
        depsLockFilePath: path.join(
          __dirname,
          `${codePath}/analytics-processing/package-lock.json`
        ),

        memorySize: 128,
        timeout: cdk.Duration.seconds(60),
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          stackName: cdk.Aws.STACK_NAME,
          CW_NAMESPACE: `${cdk.Aws.STACK_NAME}/AWSGameAnalytics`,
        },
      }
    );

    analyticsProcessingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "CloudWatch",
        effect: iam.Effect.ALLOW,
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
      })
    );
    
    analyticsProcessingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "XRay",
        effect: iam.Effect.ALLOW,
        actions: [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
        ],
        resources: ["*"],
      })
    );

    const kinesisAnalyticsRole = new iam.Role(this, "KinesisAnalyticsRole", {
      assumedBy: new iam.ServicePrincipal("kinesisanalytics.amazonaws.com"),
      inlinePolicies: {
        KinesisAnalyticsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "ReadKinesisStream",
              effect: iam.Effect.ALLOW,
              actions: [
                "kinesis:DescribeStream",
                "kinesis:GetShardIterator",
                "kinesis:GetRecords",
                "kinesis:ListShards",
              ],
              resources: [props.gameEventsStream.streamArn],
            }),
            new iam.PolicyStatement({
              sid: "LambdaAccess",
              effect: iam.Effect.ALLOW,
              actions: [
                "lambda:InvokeFunction",
                "lambda:GetFunctionConfiguration",
              ],
              resources: analyticsProcessingFunction.resourceArnsForGrantInvoke,
            }),
          ],
        }),
      },
    });

    const appCodePath = path.join(
      __dirname,
      `${codePath}/analytics-processing/app.sql`
    );

    const kinesisAnalyticsApp = new kinesisanalytics.CfnApplication(
      this,
      "KinesisAnalyticsApp",
      {
        applicationName: `AnalyticsApplication-${cdk.Aws.STACK_NAME}`,
        applicationDescription: `Real-time game analytics application, for ${cdk.Aws.STACK_NAME}`,
        // Load code from file
        applicationCode: fs.readFileSync(appCodePath).toString(),
        inputs: [
          {
            namePrefix: "AnalyticsApp",
            inputSchema: inputSchema,
            kinesisStreamsInput: {
              resourceArn: props.gameEventsStream.streamArn,
              roleArn: kinesisAnalyticsRole.roleArn,
            },
          },
        ],
      }
    );

    const kinesisAnalyticsLambdaOutput =
      new kinesisanalytics.CfnApplicationOutput(
        this,
        "KinesisAnalyticsLambdaOutput",
        {
          applicationName: kinesisAnalyticsApp.applicationName ?? "UNDEFINED",
          output: {
            name: "DESTINATION_STREAM",
            destinationSchema: {
              recordFormatType: "JSON",
            },
            lambdaOutput: {
              resourceArn: analyticsProcessingFunction.functionArn,
              roleArn: kinesisAnalyticsRole.roleArn,
            },
          },
        }
      );

    const kinesisAnalyticsErrorOutput =
      new kinesisanalytics.CfnApplicationOutput(
        this,
        "KinesisAnalyticsErrorOutput",
        {
          applicationName: kinesisAnalyticsApp.applicationName ?? "UNDEFINED",
          output: {
            name: "error_stream",
            destinationSchema: {
              recordFormatType: "JSON",
            },
            lambdaOutput: {
              resourceArn: analyticsProcessingFunction.functionArn,
              roleArn: kinesisAnalyticsRole.roleArn,
            },
          },
        }
      );

    kinesisAnalyticsLambdaOutput.addDependency(kinesisAnalyticsApp);
    kinesisAnalyticsErrorOutput.addDependency(kinesisAnalyticsApp);

    props.solutionHelper.addToRolePolicy(
      new iam.PolicyStatement({
        sid: "KinesisAnalytics",
        effect: iam.Effect.ALLOW,
        actions: [
          "kinesisanalytics:StartApplication",
          "kinesisanalytics:DescribeApplication",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:kinesisanalytics:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:application/${kinesisAnalyticsApp.applicationName}`,
        ],
      })
    );

    const startKinesisAnalyticsAppCustomResource = new cdk.CustomResource(
      this,
      "StartKinesisAnalyticsApp",
      {
        serviceToken: props.solutionHelperProvider.serviceToken,
        properties: {
          customAction: "startKinesisAnalyticsApp",
          Region: cdk.Aws.REGION,
          kinesisAnalyticsAppName: kinesisAnalyticsApp.applicationName,
        },
      }
    );

    startKinesisAnalyticsAppCustomResource.node.addDependency(
      props.gameEventsStream
    );

    startKinesisAnalyticsAppCustomResource.node.addDependency(
      kinesisAnalyticsLambdaOutput
    );

    this.analyticsProcessingFunction = analyticsProcessingFunction;

    new cdk.CfnOutput(this, "KinesisAnalyticsAppOutput", {
      description:
        "Name of the Kinesis Analytics Application for game analytics",
      value: kinesisAnalyticsApp.ref,
    });

    new cdk.CfnOutput(this, "RealTimeAnalyticsCloudWatch", {
      description:
        "Link to the Amazon CloudWatch namespace where custom metrics are published by the solution AnalyticsProcessingFunction.",
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#metricsV2:graph=~();query=${cdk.Aws.STACK_NAME}/AWSGameAnalytics`,
    });
  }
}