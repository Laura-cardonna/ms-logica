import { Controller, Get, Param, Body, Patch, Delete, UseGuards } from '@nestjs/common';
import { ConductorService } from './conductor.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UpdateConductorDto } from './dto/update-conductor.dto';

@ApiTags('Conductores')
@ApiBearerAuth()
@Controller('conductores')
@UseGuards(JwtAuthGuard) // 🚀 Tip: Al poner el Guard aquí arriba, proteges TODOS los endpoints del controlador de un solo golpe
export class ConductorController {
  constructor(private readonly conductorService: ConductorService) {}

  @Get()
  @ApiOperation({ summary: 'Obtiene todos los conductores registrados en el sistema' })
  async obtenerTodos() {
    return await this.conductorService.findAll();
  }

  // =========================================================================
  // 🛡️ ENDPOINTS COMPLEMENTARIOS DE SEGURIDAD (Listos para cuando los necesites)
  // =========================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un conductor específico por su ID (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de autenticación del conductor (UUID)', type: String })
  async obtenerUno(@Param('id') id: string) { // 👈 Forzado a string explícitamente
    return await this.conductorService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza los datos de un conductor por su ID (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de autenticación del conductor (UUID)', type: String })
  async actualizar(@Param('id') id: string, @Body() updateConductorDto: UpdateConductorDto) {
    return await this.conductorService.update(id, updateConductorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina de forma lógica o física un conductor del sistema' })
  @ApiParam({ name: 'id', description: 'ID de autenticación del conductor (UUID)', type: String })
  async eliminar(@Param('id') id: string) {
    return await this.conductorService.remove(id);
  }
}