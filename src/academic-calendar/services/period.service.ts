import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Period } from '../entities';
import { CreatePeriodDto, UpdatePeriodDto } from '../dto';

@Injectable()
export class PeriodService {
  constructor(
    @InjectRepository(Period)
    private readonly periodRepository: Repository<Period>,
  ) {}

  async create(createPeriodDto: CreatePeriodDto) {
    const period = this.periodRepository.create(createPeriodDto);
    return await this.periodRepository.save(period);
  }

  async findAll() {
    return await this.periodRepository.find({
      relations: ['gestion'],
      order: { fecha_inicio: 'DESC' },
    });
  }

  async findOne(id: number) {
    const period = await this.periodRepository.findOne({
      where: { id_periodo: id },
      relations: ['gestion'],
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${id} no encontrado`);
    }

    return period;
  }

  async update(id: number, updatePeriodDto: UpdatePeriodDto) {
    const period = await this.periodRepository.preload({
      id_periodo: id,
      ...updatePeriodDto,
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${id} no encontrado`);
    }

    return await this.periodRepository.save(period);
  }
}