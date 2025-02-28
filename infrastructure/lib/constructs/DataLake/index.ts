
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as glueCfn from "aws-cdk-lib/aws-glue";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { GameAnalyticsPipelineConfig } from "../../helpers/config-types";

interface DataLakeConstructProps {
  analyticsBucket: s3.Bucket;
  notificationsTopic: sns.Topic;
  config: GameAnalyticsPipelineConfig;
}

export class DataLakeConstruct extends Construct {
  public readonly gameEventsDatabase: glueCfn.CfnDatabase;
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

  }
}