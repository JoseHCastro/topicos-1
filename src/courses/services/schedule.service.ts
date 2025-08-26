import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities';
import { CreateScheduleDto, UpdateScheduleDto } from '../dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto) {
    const schedule = this.scheduleRepository.create(createScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async findAll() {
    return await this.scheduleRepository.find({
      relations: ['grupoMateria', 'aula'],
      order: { dia_semana: 'ASC', hora_inicio: 'ASC' },
    });
  }

  async findOne(id: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id_horario: id },
      relations: ['grupoMateria', 'aula'],
    });

    if (!schedule) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado`);
    }

    return schedule;
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.scheduleRepository.preload({
      id_horario: id,
      ...updateScheduleDto,
    });

    if (!schedule) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado`);
    }

    return await this.scheduleRepository.save(schedule);
  }
}