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
import { ScheduleService } from '../services';
import { CreateScheduleDto, UpdateScheduleDto } from '../dto';
import { PaginationDto, PaginatedResultDto } from '../../common';
import { Schedule } from '../entities';
import { Auth } from '../../auth/decorators';
import { ValidRoles } from '../../auth/interfaces';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Auth(ValidRoles.ADMIN)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Schedule>> {
    return this.scheduleService.findAll(paginationDto);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.TEACHER, ValidRoles.STUDENT)
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
