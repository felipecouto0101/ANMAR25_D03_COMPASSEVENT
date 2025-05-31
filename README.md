# Compass Event

A event management system built with NestJS, AWS DynamoDB, and AWS S3.

## Infrastructure

This project uses AWS CDK to define and provision infrastructure:

### DynamoDB Tables
- **Events**: Stores event information
- **Users**: Stores user accounts
- **Registrations**: Stores event registrations

### S3 Bucket
- **compass-event-images**: Stores event images

## Setup

### Prerequisites
- Node.js 16+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

### Environment Variables
Copy the example environment file:
```
cp .env.example .env
```

Update the values in `.env` with your configuration.

### Deploy Infrastructure
```
cd infra
npm install
cdk deploy CompassEventDynamoDBStack CompassEventS3Stack
```

### Run Application
```
npm install
npm run start:dev
```

## Architecture

This project follows Clean Architecture principles:

- **Domain**: Core business logic and entities
- **Application**: Use cases and application services
- **Infrastructure**: External services and adapters
- **Interfaces**: Controllers and DTOs

## Testing

```
npm run test
npm run test:e2e
npm run test:cov
```