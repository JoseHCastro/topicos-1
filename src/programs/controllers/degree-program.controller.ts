import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { DegreeProgramService } from '../services';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { DegreeProgram } from '../entities';
import { CreateDegreeProgramDto, UpdateDegreeProgramDto } from '../dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';

@ApiTags('Programas de Grado')
@Controller('degree-programs')
export class DegreeProgramController {
  constructor(private readonly degreeProgramService: DegreeProgramService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Crear nuevo programa de grado',
    description: 'Crea una nueva carrera o programa académico. Solo administradores pueden crear programas.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Programa de grado creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        name: { type: 'string', example: 'Ingeniería de Sistemas' },
        code: { type: 'string', example: 'ING-SIS' },
        duration: { type: 'number', example: 10 },
        description: { type: 'string', example: 'Carrera de Ingeniería de Sistemas' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o permisos insuficientes' })
  create(@Body() createDegreeProgramDto: CreateDegreeProgramDto) {
    return this.degreeProgramService.create(createDegreeProgramDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Listar programas de grado',
    description: 'Obtiene una lista paginada de todos los programas académicos disponibles.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (por defecto: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de resultados por página (por defecto: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo por el cual ordenar' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Orden de clasificación (ASC/DESC)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de programas obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              code: { type: 'string' },
              duration: { type: 'number' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o permisos insuficientes' })
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<DegreeProgram>> {
    return this.degreeProgramService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.degreeProgramService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDegreeProgramDto: UpdateDegreeProgramDto,
  ) {
    return this.degreeProgramService.update(id, updateDegreeProgramDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.degreeProgramService.remove(id);
  }
}
