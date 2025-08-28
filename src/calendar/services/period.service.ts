import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../entities';
import { CreatePeriodDto, UpdatePeriodDto } from '../dto';

@Injectable()
export class PeriodService {
  constructor(
    @InjectRepository(Term)
    private readonly periodRepository: Repository<Term>,
  ) {}

  async create(createPeriodDto: CreatePeriodDto) {
    const period = this.periodRepository.create(createPeriodDto);
    return await this.periodRepository.save(period);
  }

  async findAll() {
    return await this.periodRepository.find({
      relations: ['academic_year'],
      order: { start_date: 'DESC' },
    });
  }

  async findOne(id: string) {
    const period = await this.periodRepository.findOne({
      where: { id: id },
      relations: ['academic_year'],
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${id} no encontrado`);
    }

    return period;
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto) {
    const period = await this.periodRepository.preload({
      id: id,
      ...updatePeriodDto,
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${id} no encontrado`);
    }

    return await this.periodRepository.save(period);
  }
}