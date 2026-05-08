import { Test, TestingModule } from '@nestjs/testing';
import { ParaderoController } from './paradero.controller';
import { ParaderoService } from './paradero.service';

describe('ParaderoController', () => {
  let controller: ParaderoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParaderoController],
      providers: [ParaderoService],
    }).compile();

    controller = module.get<ParaderoController>(ParaderoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
