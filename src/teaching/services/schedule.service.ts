import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities';
import { CreateScheduleDto, UpdateScheduleDto } from '../dto';
import { PaginationDto, PaginatedResultDto, PaginationService } from '../../common';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepository.create(createScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<Schedule>> {
    return this.paginationService.paginateRepository(
      this.scheduleRepository,
      paginationDto,
      {
        relations: ['course_section', 'classroom'],
      }
    );
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['course_section', 'classroom'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, updateScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }
}
