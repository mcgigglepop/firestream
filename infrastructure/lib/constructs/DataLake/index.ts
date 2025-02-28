
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as glueCfn from "aws-cdk-lib/aws-glue";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

import { GameAnalyticsPipelineConfig } from "../../helpers/config-types";

interface DataLakeConstructProps {
  analyticsBucket: s3.Bucket;
  notificationsTopic: sns.Topic;
  config: GameAnalyticsPipelineConfig;
}

export class DataLakeConstruct extends Construct {
  public readonly gameEventsDatabase: glueCfn.CfnDatabase;
  public readonly rawEventsTable: glueCfn.CfnTable;
  public readonly gameEventsEtlRole: iam.Role;

  constructor(scope: Construct, id: string, props: DataLakeConstructProps) {
    super(scope, id);

    this.gameEventsDatabase = new glueCfn.CfnDatabase(
      this,
      "GameEventsDatabase",
      {
        catalogId: cdk.Aws.ACCOUNT_ID,
        databaseInput: {
          description: `Database for game analytics events for stack: ${cdk.Aws.STACK_NAME}`,
          locationUri: `s3://${props.analyticsBucket.bucketName}`,
        },
      }
    );

    this.rawEventsTable = new glueCfn.CfnTable(this, "GameRawEventsTable", {
      catalogId: cdk.Aws.ACCOUNT_ID,
      databaseName: this.gameEventsDatabase.ref,
      tableInput: {
        description: `Stores raw event data from the game analytics pipeline for stack ${cdk.Aws.STACK_NAME}`,
        name: props.config.RAW_EVENTS_TABLE,
        tableType: "EXTERNAL_TABLE",
        partitionKeys: [
          { name: "year", type: "string" },
          { name: "month", type: "string" },
          { name: "day", type: "string" },
        ],
        parameters: {
          classification: "parquet",
          compressionType: "none",
          typeOfData: "file",
        },
        storageDescriptor: {
          outputFormat:
            "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
          inputFormat:
            "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
          compressed: false,
          numberOfBuckets: -1,
          serdeInfo: {
            serializationLibrary:
              "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
            parameters: {
              "serialization.format": "1",
            },
          },
          bucketColumns: [],
          sortColumns: [],
          storedAsSubDirectories: false,
          location: `s3://${props.analyticsBucket.bucketName}/${props.config.RAW_EVENTS_PREFIX}`,
          columns: [
            { name: "event_id", type: "string" },
            { name: "event_type", type: "string" },
            { name: "event_name", type: "string" },
            { name: "event_version", type: "string" },
            { name: "event_timestamp", type: "bigint" },
            { name: "app_version", type: "string" },
            { name: "application_id", type: "string" },
            { name: "application_name", type: "string" },
            { name: "event_data", type: "string" },
            { name: "metadata", type: "string" },
          ],
        },
      },
    });

    this.rawEventsTable.addDependency(this.gameEventsDatabase);

    // IAM Role allowing Glue ETL Job to access Analytics Bucket
    this.gameEventsEtlRole = new iam.Role(this, "GameEventsEtlRole", {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      path: "/",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSGlueServiceRole"
        ),
      ],
    });

    this.gameEventsEtlRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "S3Access",
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ],
        resources: [
          props.analyticsBucket.bucketArn,
          `${props.analyticsBucket.bucketArn}/*`,
        ],
      })
    );

    this.gameEventsEtlRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "GlueTableAccess",
        effect: iam.Effect.ALLOW,
        actions: [
          "glue:BatchGetPartition",
          "glue:GetPartition",
          "glue:GetPartitions",
          "glue:BatchCreatePartition",
          "glue:CreatePartition",
          "glue:CreateTable",
          "glue:GetTable",
          "glue:GetTables",
          "glue:GetTableVersion",
          "glue:GetTableVersions",
          "glue:UpdatePartition",
          "glue:UpdateTable",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:catalog`,
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:table/${this.gameEventsDatabase.ref}/*`,
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:database/${this.gameEventsDatabase.ref}`,
        ],
      })
    );

    this.gameEventsEtlRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "GlueDBAccess",
        effect: iam.Effect.ALLOW,
        actions: [
          "glue:GetDatabase",
          "glue:GetDatabases",
          "glue:UpdateDatabase",
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:catalog`,
          `arn:${cdk.Aws.PARTITION}:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:database/${this.gameEventsDatabase.ref}`,
        ],
      })
    );

    this.gameEventsEtlRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "KMSAccess",
        effect: iam.Effect.ALLOW,
        actions: ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey"],
        resources: [
          `arn:${cdk.Aws.PARTITION}:kms:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:alias/aws/glue`,
        ],
      })
    );

  }
}