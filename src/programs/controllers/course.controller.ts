import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { CourseService } from '../services';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { Course } from '../entities';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createCourseDto: any) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResultDto<Course>> {
    return this.courseService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
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
