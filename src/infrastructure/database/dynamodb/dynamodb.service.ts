import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  DeleteCommand, 
  ScanCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDBService {
  private readonly docClient: DynamoDBDocumentClient;

  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoDBClient: DynamoDBClient,
  ) {
    this.docClient = DynamoDBDocumentClient.from(this.dynamoDBClient);
  }

  async put(params: { TableName: string; Item: Record<string, any> }) {
    const command = new PutCommand(params);
    return this.docClient.send(command);
  }

  async get(params: { TableName: string; Key: Record<string, any> }) {
    const command = new GetCommand(params);
    return this.docClient.send(command);
  }

  async delete(params: { TableName: string; Key: Record<string, any> }) {
    const command = new DeleteCommand(params);
    return this.docClient.send(command);
  }

  async scan(params: { TableName: string; FilterExpression?: string; ExpressionAttributeValues?: Record<string, any> }) {
    const command = new ScanCommand(params);
    return this.docClient.send(command);
  }

  async query(params: { 
    TableName: string; 
    KeyConditionExpression: string; 
    ExpressionAttributeValues: Record<string, any>;
    ExpressionAttributeNames?: Record<string, string>;
    IndexName?: string;
  }) {
    const command = new QueryCommand(params);
    return this.docClient.send(command);
  }
}