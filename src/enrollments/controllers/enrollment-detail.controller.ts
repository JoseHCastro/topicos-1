import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { EnrollmentDetailService } from '../services';
import { CreateEnrollmentDetailDto, UpdateEnrollmentDetailDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { EnrollmentDetail } from '../entities';

@Controller('enrollment-details')
export class EnrollmentDetailController {
  constructor(private readonly enrollmentDetailService: EnrollmentDetailService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  create(@Body() createEnrollmentDetailDto: CreateEnrollmentDetailDto) {
    return this.enrollmentDetailService.create(createEnrollmentDetailDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResultDto<EnrollmentDetail>> {
    return this.enrollmentDetailService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentDetailService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEnrollmentDetailDto: UpdateEnrollmentDetailDto,
  ) {
    return this.enrollmentDetailService.update(id, updateEnrollmentDetailDto);
  }
}