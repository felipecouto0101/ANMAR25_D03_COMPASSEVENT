import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, Module, Controller, Get } from '@nestjs/common';


@Controller()
class TestController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}


@Module({
  controllers: [TestController],
})
class TestModule {}


describe('Simple Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });
  
  it('should return Hello World', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);
      
    expect(response.text).toBe('Hello World!');
  });
});