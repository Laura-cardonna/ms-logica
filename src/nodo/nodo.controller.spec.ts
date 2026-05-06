import { Test, TestingModule } from '@nestjs/testing';
import { NodoController } from './nodo.controller';
import { NodoService } from './nodo.service';

describe('NodoController', () => {
  let controller: NodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodoController],
      providers: [NodoService],
    }).compile();

    controller = module.get<NodoController>(NodoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
