import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { S3Module } from '../../infrastructure/storage/s3/s3.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserDynamoDBRepository } from '../../infrastructure/repositories/user.repository';

@Module({
  imports: [DatabaseModule, S3Module],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'UserRepository',
      useClass: UserDynamoDBRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}