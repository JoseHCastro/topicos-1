import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { DegreeProgramService } from '../services';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { DegreeProgram } from '../entities';

@Controller('degree-programs')
export class DegreeProgramController {
  constructor(private readonly degreeProgramService: DegreeProgramService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createDegreeProgramDto: any) {
    return this.degreeProgramService.create(createDegreeProgramDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResultDto<DegreeProgram>> {
    return this.degreeProgramService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.degreeProgramService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDegreeProgramDto: any) {
    return this.degreeProgramService.update(id, updateDegreeProgramDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.degreeProgramService.remove(id);
  }
}
