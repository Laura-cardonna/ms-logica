import { Test, TestingModule } from '@nestjs/testing';
import { IncidenteBusController } from './incidente_bus.controller';
import { IncidenteBusService } from './incidente_bus.service';

describe('IncidenteBusController', () => {
  let controller: IncidenteBusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidenteBusController],
      providers: [IncidenteBusService],
    }).compile();

    controller = module.get<IncidenteBusController>(IncidenteBusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
