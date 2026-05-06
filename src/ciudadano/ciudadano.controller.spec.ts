import { Test, TestingModule } from '@nestjs/testing';
import { CiudadanoController } from './ciudadano.controller';
import { CiudadanoService } from './ciudadano.service';

describe('CiudadanoController', () => {
  let controller: CiudadanoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CiudadanoController],
      providers: [CiudadanoService],
    }).compile();

    controller = module.get<CiudadanoController>(CiudadanoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
