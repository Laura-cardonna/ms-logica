import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { MetodoPagoCiudadanoService } from './metodo_pago_ciudadano.service';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo_pago_ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo_pago_ciudadano.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; // Ajusta la ruta si es necesario

@Controller('metodo-pago-ciudadano')
export class MetodoPagoCiudadanoController {
  constructor(private readonly metodoPagoCiudadanoService: MetodoPagoCiudadanoService) {}

  // ==========================================
  // NUEVOS ENDPOINTS: HU-ENTR-2-013 (ePayco)
  // ==========================================

  @UseGuards(JwtAuthGuard) 
  @Post('iniciar-recarga')
  iniciarRecarga(@Req() req: any, @Body() body: { tarjetaId: number, monto: number }) {
    const ciudadanoId = req.user.id; 
    return this.metodoPagoCiudadanoService.generarReferenciaPago(
      ciudadanoId, 
      body.tarjetaId, 
      body.monto
    );
  }

  @Post('epayco-webhook')
  async confirmarPagoEpayco(@Body() payload: any) {
    return this.metodoPagoCiudadanoService.procesarConfirmacionEpayco(payload);
  }

  // ==========================================
  // ENDPOINTS CRUD (Generados por Nest CLI)
  // ==========================================

  @Post()
  create(@Body() createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto) {
    return this.metodoPagoCiudadanoService.create(createMetodoPagoCiudadanoDto);
  }

  @Get()
  findAll() {
    return this.metodoPagoCiudadanoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metodoPagoCiudadanoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto) {
    return this.metodoPagoCiudadanoService.update(+id, updateMetodoPagoCiudadanoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metodoPagoCiudadanoService.remove(+id);
  }
}