import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CourseSectionService } from '../services';
import { CreateCourseSectionDto, UpdateCourseSectionDto } from '../dto';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { CourseSection } from '../entities';

@Controller('course-sections')
export class CourseSectionController {
  constructor(private readonly courseSectionService: CourseSectionService) {}

  @Post()
  create(@Body() createCourseSectionDto: CreateCourseSectionDto) {
    return this.courseSectionService.create(createCourseSectionDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResultDto<CourseSection>> {
    return this.courseSectionService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseSectionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseSectionDto: UpdateCourseSectionDto) {
    return this.courseSectionService.update(id, updateCourseSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseSectionService.remove(id);
  }
}
