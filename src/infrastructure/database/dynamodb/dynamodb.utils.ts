import { DynamoDBClient, CreateTableCommand, ScalarAttributeType, KeyType, ProjectionType } from '@aws-sdk/client-dynamodb';

export async function createEventTable(dynamoDBClient: DynamoDBClient): Promise<void> {
  const params = {
    TableName: 'Events',
    KeySchema: [
      { AttributeName: 'id', KeyType: KeyType.HASH },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'date', AttributeType: ScalarAttributeType.S },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'DateIndex',
        KeySchema: [
          { AttributeName: 'date', KeyType: KeyType.HASH },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    await dynamoDBClient.send(new CreateTableCommand(params));
    console.log('Events table created successfully');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Events table already exists');
      return;
    }
    console.error('Error creating Events table:', error);
    throw error;
  }
}

export async function createUserTable(dynamoDBClient: DynamoDBClient): Promise<void> {
  const params = {
    TableName: 'Users',
    KeySchema: [
      { AttributeName: 'id', KeyType: KeyType.HASH },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'email', AttributeType: ScalarAttributeType.S },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: KeyType.HASH },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    await dynamoDBClient.send(new CreateTableCommand(params));
    console.log('Users table created successfully');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Users table already exists');
      return;
    }
    console.error('Error creating Users table:', error);
    throw error;
  }
}

export async function createRegistrationTable(dynamoDBClient: DynamoDBClient): Promise<void> {
  const params = {
    TableName: 'Registrations',
    KeySchema: [
      { AttributeName: 'id', KeyType: KeyType.HASH },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'userId', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'eventId', AttributeType: ScalarAttributeType.S },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: KeyType.HASH },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'EventIdIndex',
        KeySchema: [
          { AttributeName: 'eventId', KeyType: KeyType.HASH },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    await dynamoDBClient.send(new CreateTableCommand(params));
    console.log('Registrations table created successfully');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Registrations table already exists');
      return;
    }
    console.error('Error creating Registrations table:', error);
    throw error;
  }
}