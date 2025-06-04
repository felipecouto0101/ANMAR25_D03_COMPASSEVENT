import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { RegistrationsService } from '../../registrations/registrations.service';

@Injectable()
export class RegistrationOwnerGuard implements CanActivate {
  constructor(
    private readonly registrationsService: RegistrationsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const registrationId = request.params.id;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    
    if (!registrationId) {
      return true;
    }

    try {
      
      if (user.role === 'admin') {
        return true;
      }
      
      
      const registration = await this.registrationsService['registrationRepository'].findById(registrationId);
      
      if (registration && registration.userId === user.id) {
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}