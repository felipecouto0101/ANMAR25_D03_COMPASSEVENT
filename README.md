# ANMAR25_D03_COMPASSEVENT

## Descrição
API para gerenciamento de eventos utilizando NestJS e DynamoDB.

## Estrutura do Projeto

- **Domain**: Contém as entidades de negócio e interfaces de repositórios
- **Application**: Contém os casos de uso da aplicação
- **Infrastructure**: Contém implementações concretas (DynamoDB, repositórios)
- **Presentation**: Controladores e DTOs

## Configuração do DynamoDB Local

```bash
# Usando Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Ou baixe e execute o DynamoDB Local manualmente
```

## Variáveis de Ambiente

```
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000
```

## Instalação

```bash
npm install
```

## Executando a aplicação

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Testes

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```
