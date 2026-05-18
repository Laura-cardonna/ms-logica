import { 
  Controller, 
  Post, 
  Param, 
  Body, 
  UseGuards, 
  ParseIntPipe, 
  BadRequestException, 
  Get,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { TurnoService } from './turno.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from './get-user.decorator'; 
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; 
import { CreateTurnoDto } from './dto/create-turno.dto';

@ApiTags('Conductores y Turnos')
@ApiBearerAuth()
@Controller('turnos')
@UseGuards(JwtAuthGuard) // 🚀 Tip pro: Ponemos el Guard a nivel global de controlador para proteger todas las rutas juntas
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  /**
   * VISTA DEL ADMINISTRADOR / GERENTE
   * Endpoint para crear un turno de forma manual asignando bus y conductor
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Permite al Gerente crear un turno de forma manual' })
  async crearTurnoManual(@Body() createTurnoDto: CreateTurnoDto) {
    return await this.turnoService.create(createTurnoDto);
  }
  
  /**
   * VISTA DEL CONDUCTOR (HU-ENTR-2-006)
   * Obtiene el historial de turnos del conductor autenticado
   */
  @Get('mis-turnos')
  @ApiOperation({ summary: 'Obtiene el historial de turnos del conductor autenticado' })
  async obtenerMisTurnos(@GetUser('id') conductorId: string) {
    return this.turnoService.obtenerMisTurnos(conductorId);
  }

  /**
   * 🚨 NUEVO: VISTA DEL CONDUCTOR
   * Obtiene el turno actual que está 'en_curso' para el conductor autenticado
   */
  @Get('mi-turno-activo')
  @ApiOperation({ summary: 'Obtiene el turno activo (en_curso) del conductor autenticado' })
  async obtenerMiTurnoActivo(@GetUser('id') conductorId: string) {
    // Nota: Vamos a asumir que tu TurnoService necesita un método para buscar este turno.
    return this.turnoService.obtenerTurnoActivo(conductorId);
  }

  /**
   * VISTA DEL CONDUCTOR (HU-ENTR-2-006)
   * Registra el inicio de turno de un conductor y enlaza el bus
   */
  @Post(':id/iniciar')
  @ApiOperation({ summary: 'Registra el inicio de turno de un conductor' })
  async iniciarTurno(
    @Param('id', ParseIntPipe) turnoId: number,
    @GetUser('id') conductorId: string, 
    @Body() body: { estadoBusConfirmado: string; observaciones?: string }
  ) {
    if (!body.estadoBusConfirmado) {
      throw new BadRequestException('Debe confirmar el estado operativo del bus.');
    }

    return this.turnoService.iniciarTurno(
      turnoId, 
      conductorId, 
      body.estadoBusConfirmado, 
      body.observaciones
    );
  }

  /**
   * 🚀 NUEVO: VISTA DEL CONDUCTOR (CIERRE DE JORNADA)
   * Registra la finalización de un turno activo y libera la flota en el sistema
   */
  @Post(':id/finalizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registra la finalización y cierre del turno del conductor' })
  async finalizarTurno(
    @Param('id', ParseIntPipe) turnoId: number,
    @GetUser('id') conductorId: string
  ) {
    // Llamamos directamente al nuevo método que añadimos en el TurnoService
    return this.turnoService.finalizarTurno(turnoId, conductorId);
  }
}