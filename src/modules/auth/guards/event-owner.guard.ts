import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { EventsService } from '../../events/events.service';

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(
    private readonly eventsService: EventsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const eventId = request.params.id;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'admin') {
      return true;
    }

    if (!eventId) {
      return true;
    }

    try {
      const event = await this.eventsService.findById(eventId);
      
      
      if (event && event.organizerId === user.id) {
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}