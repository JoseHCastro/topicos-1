import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PrerequisiteService } from '../services';
import { CreatePrerequisiteDto, UpdatePrerequisiteDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('prerequisites')
export class PrerequisiteController {
  constructor(private readonly prerequisiteService: PrerequisiteService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  create(@Body() createPrerequisiteDto: CreatePrerequisiteDto) {
    return this.prerequisiteService.create(createPrerequisiteDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findAll() {
    return this.prerequisiteService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prerequisiteService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrerequisiteDto: UpdatePrerequisiteDto,
  ) {
    return this.prerequisiteService.update(id, updatePrerequisiteDto);
  }
}