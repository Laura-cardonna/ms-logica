import { Test, TestingModule } from '@nestjs/testing';
import { MetodoPagoCiudadanoController } from './metodo_pago_ciudadano.controller';
import { MetodoPagoCiudadanoService } from './metodo_pago_ciudadano.service';

describe('MetodoPagoCiudadanoController', () => {
  let controller: MetodoPagoCiudadanoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetodoPagoCiudadanoController],
      providers: [MetodoPagoCiudadanoService],
    }).compile();

    controller = module.get<MetodoPagoCiudadanoController>(MetodoPagoCiudadanoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
