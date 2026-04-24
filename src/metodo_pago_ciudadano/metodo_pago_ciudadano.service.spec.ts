import { Test, TestingModule } from '@nestjs/testing';
import { MetodoPagoCiudadanoService } from './metodo_pago_ciudadano.service';

describe('MetodoPagoCiudadanoService', () => {
  let service: MetodoPagoCiudadanoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetodoPagoCiudadanoService],
    }).compile();

    service = module.get<MetodoPagoCiudadanoService>(MetodoPagoCiudadanoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
