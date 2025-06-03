import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'compass-event';

    this.bucket = new s3.Bucket(this, 'EventImagesBucket', {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      publicReadAccess: true,
      versioned: true,
    });

    const imageProcessorLambda = new lambda.Function(this, 'ImageProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'image-processor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        NODE_ENV: 'production'
      }
    });

    this.bucket.grantReadWrite(imageProcessorLambda);

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED, 
      new s3n.LambdaDestination(imageProcessorLambda),
      { prefix: 'profiles/' }
    );
    
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED, 
      new s3n.LambdaDestination(imageProcessorLambda),
      { prefix: 'events/' }
    );

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'The name of the S3 bucket for event images',
      exportName: 'EventImagesBucketName',
    });

    new cdk.CfnOutput(this, 'BucketDomainName', {
      value: this.bucket.bucketDomainName,
      description: 'The domain name of the S3 bucket',
      exportName: 'EventImagesBucketDomain',
    });
  }
}