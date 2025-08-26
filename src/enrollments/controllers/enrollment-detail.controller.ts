import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { EnrollmentDetailService } from '../services';
import { CreateEnrollmentDetailDto, UpdateEnrollmentDetailDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('enrollment-details')
export class EnrollmentDetailController {
  constructor(private readonly enrollmentDetailService: EnrollmentDetailService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  create(@Body() createEnrollmentDetailDto: CreateEnrollmentDetailDto) {
    return this.enrollmentDetailService.create(createEnrollmentDetailDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findAll() {
    return this.enrollmentDetailService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentDetailService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.PROFESSOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnrollmentDetailDto: UpdateEnrollmentDetailDto,
  ) {
    return this.enrollmentDetailService.update(id, updateEnrollmentDetailDto);
  }
}