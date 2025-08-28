import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CourseService } from '../services';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createCourseDto: any) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCourseDto: any) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.courseService.remove(id);
  }
}