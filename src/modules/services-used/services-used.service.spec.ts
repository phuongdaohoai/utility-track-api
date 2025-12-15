import { Test, TestingModule } from '@nestjs/testing';
import { ServicesUsedService } from './services-used.service';

describe('ServicesUsedService', () => {
  let service: ServicesUsedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesUsedService],
    }).compile();

    service = module.get<ServicesUsedService>(ServicesUsedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
