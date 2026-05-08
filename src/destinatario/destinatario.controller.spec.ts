import { Test, TestingModule } from '@nestjs/testing';
import { DestinatarioController } from './destinatario.controller';
import { DestinatarioService } from './destinatario.service';

describe('DestinatarioController', () => {
  let controller: DestinatarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DestinatarioController],
      providers: [DestinatarioService],
    }).compile();

    controller = module.get<DestinatarioController>(DestinatarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
