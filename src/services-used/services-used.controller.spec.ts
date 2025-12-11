import { Test, TestingModule } from '@nestjs/testing';
import { ServicesUsedController } from './services-used.controller';

describe('ServicesUsedController', () => {
  let controller: ServicesUsedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesUsedController],
    }).compile();

    controller = module.get<ServicesUsedController>(ServicesUsedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
