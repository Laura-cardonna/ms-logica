import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
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
  
}