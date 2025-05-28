import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;
    const userId = request.params.userId;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    
    if (user.role === 'admin') {
      return true;
    }

    
    if (userId && userId === user.id) {
      return true;
    }

    
    if (resourceId && resourceId === user.id) {
      return true;
    }

    return false;
  }
}