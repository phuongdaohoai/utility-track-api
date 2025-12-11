import { Test, TestingModule } from '@nestjs/testing';
import { ResidentsService } from './residents.service';

describe('ResidentsService', () => {
  let service: ResidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResidentsService],
    }).compile();

    service = module.get<ResidentsService>(ResidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
