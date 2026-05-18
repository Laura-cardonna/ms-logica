import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BoletoService } from './boleto.service';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; 
import { CreateBoletoDto } from './dto/create-boleto.dto';

@ApiTags('boletos')
@ApiBearerAuth()
@Controller('boletos')
@UseGuards(JwtAuthGuard) // Esto protege TODOS los métodos del controlador
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  /**
   * REGISTRAR ABORDAJE (HISTORIA DE MARÍA)
   * Este endpoint recibe el bus, paradero y el ID de la TARJETA del ciudadano.
   */
  @ApiOperation({ summary: 'Registrar abordaje y generar boleto validando saldo' })
  @Post()
  async create(@Req() req: any, @Body() body: CreateBoletoDto) { // 🎯 Tipamos con tu DTO real
    // El JwtAuthGuard ya extrajo el ID del token y lo puso en req.user.id
    const ciudadanoId = req.user.id;

    // Preparamos los datos normalizados respetando exactamente tu DTO y el Service
    const data = {
      bus_id: Number(body.bus_id),
      paraderoAbordaje_id: Number(body.paraderoAbordaje_id), // 🔄 Corregido match con DTO
      metodoPagoCiudadano_id: Number(body.metodoPagoCiudadano_id), // 🔄 Corregido match con DTO
      ciudadano_id: ciudadanoId,
    };

    // Llamamos a la lógica de negocio que valida saldo y descuenta
    return await this.boletoService.create(data);
  }

  /**
   * OBTENER BOLETOS DEL USUARIO LOGUEADO
   */
  @ApiOperation({ summary: 'Obtener boletos del ciudadano autenticado' })
  @Get('mis-boletos')
  async findMyTickets(@Req() req: any) {
    const ciudadanoId = req.user.id;
    return this.boletoService.getBoletosByUserId(ciudadanoId);
  }

  /**
   * OBTENER TARJETAS DEL USUARIO LOGUEADO
   */
  @ApiOperation({ summary: 'Obtener tarjetas del ciudadano autenticado' })
  @Get('mis-tarjetas')
  async findMyCards(@Req() req: any) {
    const ciudadanoId = req.user.id; // 🎯 Saca el ID seguro del token JWT
    return this.boletoService.getTarjetasByUserId(ciudadanoId);
  }

  @ApiOperation({ summary: 'Obtener todos los boletos (Admin)' })
  @Get()
  findAll() {
    return this.boletoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un boleto por su ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boletoService.findOne(+id);
  }

  @ApiOperation({ summary: 'Actualizar estado de un boleto (Finalizar/Cancelar)' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoletoDto: UpdateBoletoDto) {
    return this.boletoService.update(+id, updateBoletoDto);
  }

  @ApiOperation({ summary: 'Eliminar un boleto' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boletoService.remove(+id);
  }

  @ApiOperation({ summary: 'Obtener boletos de un usuario específico por ID (Admin)' })
  @Get('user/:id')
  findByUser(@Param('id') id: string) {
    return this.boletoService.getBoletosByUserId(id);
  }

  @Post('finalizar-viaje')
  async finalizarViaje(
    @Body() data: { boleto_id: number; paraderoDescenso_id: number }
  ) {
    return await this.boletoService.finalizarViaje(data);
  }
}