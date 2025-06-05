import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand, 
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDBService {
  private docClient: any;

  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoDBClient: DynamoDBClient,
  ) {
   
    if (process.env.NODE_ENV === 'test') {
      this.docClient = {
        send: jest.fn().mockResolvedValue({}),
      };
    } else {
      this.docClient = DynamoDBDocumentClient.from(this.dynamoDBClient);
    }
  }

  async put(params: { TableName: string; Item: Record<string, any> }) {
    const command = new PutCommand(params);
    return this.docClient.send(command);
  }

  async get(params: { TableName: string; Key: Record<string, any> }) {
    const command = new GetCommand(params);
    return this.docClient.send(command);
  }

  async query(params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
    Limit?: number;
    ScanIndexForward?: boolean;
  }) {
    const command = new QueryCommand(params);
    return this.docClient.send(command);
  }

  async scan(params: {
    TableName: string;
    FilterExpression?: string;
    ExpressionAttributeValues?: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    Limit?: number;
  }) {
    const command = new ScanCommand(params);
    return this.docClient.send(command);
  }

  async delete(params: { TableName: string; Key: Record<string, any> }) {
    const command = new DeleteCommand(params);
    return this.docClient.send(command);
  }

  async update(params: {
    TableName: string;
    Key: Record<string, any>;
    UpdateExpression: string;
    ExpressionAttributeValues: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    ReturnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
  }) {
    const command = new UpdateCommand(params);
    return this.docClient.send(command);
  }
}