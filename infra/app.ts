import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from './stacks/dynamodb-stack';
import { S3Stack } from './stacks/s3-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new DynamoDBStack(app, 'CompassEventDynamoDBStack', { env });
new S3Stack(app, 'CompassEventS3Stack', { env });

app.synth();