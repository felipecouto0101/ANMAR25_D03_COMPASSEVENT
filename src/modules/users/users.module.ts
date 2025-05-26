import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersService } from './users.service';
import { UserDynamoDBRepository } from '../../infrastructure/repositories/user.repository';

@Module({
  imports: [DatabaseModule],
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