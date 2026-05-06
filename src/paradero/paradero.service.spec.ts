import { Test, TestingModule } from '@nestjs/testing';
import { ParaderoService } from './paradero.service';

describe('ParaderoService', () => {
  let service: ParaderoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParaderoService],
    }).compile();

    service = module.get<ParaderoService>(ParaderoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
