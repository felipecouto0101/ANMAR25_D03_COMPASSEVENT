import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(() => {
    appService = {
      getHello: jest.fn().mockReturnValue('Hello World!')
    } as any;
    
    appController = new AppController(appService);
  });

  describe('getHello', () => {
    it('should return the string from AppService', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appService.getHello).toHaveBeenCalled();
    });
  });
});