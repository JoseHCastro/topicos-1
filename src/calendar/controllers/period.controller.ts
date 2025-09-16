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
import { PeriodService } from '../services';
import { CreatePeriodDto, UpdatePeriodDto } from '../dto';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { Term } from '../entities';

@Controller('periods')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Post()
  //@Auth(ValidRoles.ADMIN)
  create(@Body() createPeriodDto: CreatePeriodDto) {
    return this.periodService.create(createPeriodDto);
  }

  @Get()
  //@Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Term>> {
    return this.periodService.findAll(paginationDto);
  }

  @Get(':id')
  //@Auth(ValidRoles.ADMIN, ValidRoles.STUDENT, ValidRoles.TEACHER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  //@Auth(ValidRoles.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePeriodDto: UpdatePeriodDto,
  ) {
    return this.periodService.update(id, updatePeriodDto);
  }
}
