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
import { CourseSectionService } from '../services';
import { CreateCourseSectionDto, UpdateCourseSectionDto } from '../dto';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { CourseSection } from '../entities';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('course-sections')
export class CourseSectionController {
  constructor(private readonly courseSectionService: CourseSectionService) {}

  @Post()
  //@Auth(ValidRoles.ADMIN)
  create(@Body() createCourseSectionDto: CreateCourseSectionDto) {
    return this.courseSectionService.create(createCourseSectionDto);
  }

  @Get()
  //@Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<CourseSection>> {
    return this.courseSectionService.findAll(paginationDto);
  }

  @Get(':id')
  //@Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findOne(@Param('id') id: string) {
    return this.courseSectionService.findOne(id);
  }

  @Patch(':id')
  //@Auth(ValidRoles.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateCourseSectionDto: UpdateCourseSectionDto,
  ) {
    return this.courseSectionService.update(id, updateCourseSectionDto);
  }

  @Delete(':id')
  //@Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.courseSectionService.remove(id);
  }
}
