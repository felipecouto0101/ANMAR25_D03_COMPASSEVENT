import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from './stacks/dynamodb-stack';

const app = new cdk.App();

new DynamoDBStack(app, 'CompassEventDynamoDBStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

app.synth();