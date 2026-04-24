import { Test, TestingModule } from '@nestjs/testing';
import { ProgramacionService } from './programacion.service';

describe('ProgramacionService', () => {
  let service: ProgramacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramacionService],
    }).compile();

    service = module.get<ProgramacionService>(ProgramacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
