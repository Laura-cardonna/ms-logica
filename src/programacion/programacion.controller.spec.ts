import { Test, TestingModule } from '@nestjs/testing';
import { ProgramacionController } from './programacion.controller';
import { ProgramacionService } from './programacion.service';

describe('ProgramacionController', () => {
  let controller: ProgramacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramacionController],
      providers: [ProgramacionService],
    }).compile();

    controller = module.get<ProgramacionController>(ProgramacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
