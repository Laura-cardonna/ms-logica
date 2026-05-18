import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProgramacionService } from './programacion.service';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Programaciones')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('programacion')
export class ProgramacionController {
  constructor(private readonly programacionService: ProgramacionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva programación',
    description: 'Asigna un bus a una ruta en fecha y hora específica, soportando recurrencia.',
  })
  @ApiResponse({ status: 201, description: 'Programación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en validación de datos' })
  @ApiResponse({ status: 409, description: 'Conflicto: El bus ya está ocupado' })
  async create(@Body() createProgramacionDto: CreateProgramacionDto) {
    return await this.programacionService.create(createProgramacionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las programaciones',
    description: 'Retorna los horarios para la consulta de los usuarios.',
  })
  @ApiResponse({ status: 200, description: 'Lista de programaciones' })
  async findAll() {
    return await this.programacionService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una programación por ID',
  })
  @ApiResponse({ status: 200, description: 'Programación encontrada' })
  @ApiResponse({ status: 404, description: 'Programación no encontrada' })
  async findOne(@Param('id') id: string) {
    return await this.programacionService.findOne(+id);
  }
}