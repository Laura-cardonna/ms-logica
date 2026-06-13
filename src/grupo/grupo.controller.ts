import { Controller, Post, Body, Get, Param, UseGuards, Req, Delete, Patch, Query } from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('grupo')
export class GrupoController {
  constructor(private readonly grupoService: GrupoService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createGrupoDto: CreateGrupoDto, @Req() req: any) {
    // Tomamos el ID del usuario autenticado desde el token decodificado por el Guard
    createGrupoDto.creadorId = req.user.id; 
    return this.grupoService.create(createGrupoDto);
  }

  @UseGuards(JwtAuthGuard)
@Get('persona/:id')
  findByPersona(@Param('id') id: string) { // Asegúrate que aquí diga string
    return this.grupoService.findByPersona(id); // <--- QUITA EL + AQUÍ
  }

  @UseGuards(JwtAuthGuard)
  @Get('publicos/disponibles')
  findPublicos(@Req() req: any) {
    // Usamos el ID del token para saber cuáles NO mostrarle
    return this.grupoService.findPublicosDisponibles(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unirse')
  unirse(@Param('id') grupoId: number, @Req() req: any) {
    return this.grupoService.unirseAGrupo(grupoId, req.user.id);
  }
  
  // Importa Delete, Patch, Query arriba en @nestjs/common

  @UseGuards(JwtAuthGuard)
  @Get(':id/miembros')
  obtenerMiembros(@Param('id') grupoId: number, @Query('search') search?: string) {
    // Si mandan search, filtramos por nombre, si no, los trae todos
    return this.grupoService.obtenerMiembros(grupoId, search);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/miembros/:personaId/promover')
  promoverAdmin(@Param('id') grupoId: number, @Param('personaId') personaId: string, @Req() req: any) {
    return this.grupoService.promoverAdmin(grupoId, personaId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/miembros/:personaId')
  removerMiembro(@Param('id') grupoId: number, @Param('personaId') personaId: string, @Req() req: any) {
    return this.grupoService.removerMiembro(grupoId, personaId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/miembros/:personaId/bloquear')
  bloquearMiembro(@Param('id') grupoId: number, @Param('personaId') personaId: string, @Req() req: any) {
    return this.grupoService.bloquearMiembro(grupoId, personaId, req.user.id);
  }

  @Get(':id/membresia-logs')
  obtenerLogsMembresia(@Param('id') grupoId: number) {
    // 🚨 CORREGIDO: Ahora llamamos al servicio como corresponde en NestJS
    return this.grupoService.obtenerLogsMembresia(Number(grupoId));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/abandonar')
  abandonarGrupo(@Param('id') grupoId: number, @Req() req: any) {
    return this.grupoService.abandonarGrupo(grupoId, req.user.id);
  }

}