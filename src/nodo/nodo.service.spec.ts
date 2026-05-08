import { Test, TestingModule } from '@nestjs/testing';
import { NodoService } from './nodo.service';

describe('NodoService', () => {
  let service: NodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodoService],
    }).compile();

    service = module.get<NodoService>(NodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
