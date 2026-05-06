import { Test, TestingModule } from '@nestjs/testing';
import { CiudadanoService } from './ciudadano.service';

describe('CiudadanoService', () => {
  let service: CiudadanoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CiudadanoService],
    }).compile();

    service = module.get<CiudadanoService>(CiudadanoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
