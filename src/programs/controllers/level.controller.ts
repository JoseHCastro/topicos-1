import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { LevelService } from '../services/level.service';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { Level } from '../entities';
import { CreateLevelDto, UpdateLevelDto } from '../dto';

@Controller('levels')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Post()
  //@Auth(ValidRoles.ADMIN)
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelService.create(createLevelDto);
  }

  @Get()
  //@Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Level>> {
    return this.levelService.findAll(paginationDto);
  }

  @Get(':id')
  //@Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findOne(@Param('id') id: string) {
    return this.levelService.findOne(id);
  }

  @Patch(':id')
  //@Auth(ValidRoles.ADMIN)
  update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.levelService.update(id, updateLevelDto);
  }

  @Delete(':id')
  //@Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.levelService.remove(id);
  }
}
