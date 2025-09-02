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
import { ClassroomService } from '../services';
import { CreateClassroomDto, UpdateClassroomDto } from '../dto';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { Classroom } from '../entities';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createClassroomDto: CreateClassroomDto) {
    return this.classroomService.create(createClassroomDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Classroom>> {
    return this.classroomService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findOne(@Param('id') id: string) {
    return this.classroomService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ) {
    return this.classroomService.update(id, updateClassroomDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.classroomService.remove(id);
  }
}
