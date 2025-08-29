import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GradeService } from '../services';
import { CreateGradeDto, UpdateGradeDto } from '../dto';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { Grade } from '../entities';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER)
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradeService.create(createGradeDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('student_id') studentId?: string,
    @Query('course_section_id') courseSectionId?: string,
  ): Promise<PaginatedResultDto<Grade>> {
    if (studentId) {
      return this.gradeService.findByStudent(studentId, paginationDto);
    }
    if (courseSectionId) {
      return this.gradeService.findByCourseSection(courseSectionId, paginationDto);
    }
    return this.gradeService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findOne(@Param('id') id: string) {
    return this.gradeService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER)
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradeService.update(id, updateGradeDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.gradeService.remove(id);
  }
}