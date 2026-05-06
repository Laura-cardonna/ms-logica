import { Test, TestingModule } from '@nestjs/testing';
import { DestinatarioService } from './destinatario.service';

describe('DestinatarioService', () => {
  let service: DestinatarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DestinatarioService],
    }).compile();

    service = module.get<DestinatarioService>(DestinatarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
