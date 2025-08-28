import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LevelService } from '../services/level.service';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('levels')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createLevelDto: any) {
    return this.levelService.create(createLevelDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findAll() {
    return this.levelService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findOne(@Param('id') id: string) {
    return this.levelService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  update(@Param('id') id: string, @Body() updateLevelDto: any) {
    return this.levelService.update(id, updateLevelDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.levelService.remove(id);
  }
}