import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GradeService } from '../services';
import { CreateGradeDto, UpdateGradeDto } from '../dto';

@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradeService.create(createGradeDto);
  }

  @Get()
  findAll(
    @Query('student_id') studentId?: string,
    @Query('course_section_id') courseSectionId?: string,
  ) {
    if (studentId) {
      return this.gradeService.findByStudent(studentId);
    }
    if (courseSectionId) {
      return this.gradeService.findByCourseSection(courseSectionId);
    }
    return this.gradeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradeService.update(id, updateGradeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gradeService.remove(id);
  }
}