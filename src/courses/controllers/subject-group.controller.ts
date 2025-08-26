import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { SubjectGroupService } from '../services';
import { CreateSubjectGroupDto, UpdateSubjectGroupDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('subject-groups')
export class SubjectGroupController {
  constructor(private readonly subjectGroupService: SubjectGroupService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  create(@Body() createSubjectGroupDto: CreateSubjectGroupDto) {
    return this.subjectGroupService.create(createSubjectGroupDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findAll() {
    return this.subjectGroupService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectGroupService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectGroupDto: UpdateSubjectGroupDto,
  ) {
    return this.subjectGroupService.update(id, updateSubjectGroupDto);
  }
}