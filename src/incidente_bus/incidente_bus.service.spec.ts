import { Test, TestingModule } from '@nestjs/testing';
import { IncidenteBusService } from './incidente_bus.service';

describe('IncidenteBusService', () => {
  let service: IncidenteBusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidenteBusService],
    }).compile();

    service = module.get<IncidenteBusService>(IncidenteBusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
