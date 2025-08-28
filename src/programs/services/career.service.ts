import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DegreeProgram } from '../entities';
import { CreateCareerDto, UpdateCareerDto } from '../dto';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(DegreeProgram)
    private readonly careerRepository: Repository<DegreeProgram>,
  ) {}

  async create(createCareerDto: CreateCareerDto) {
    const career = this.careerRepository.create(createCareerDto);
    return await this.careerRepository.save(career);
  }

  async findAll() {
    return await this.careerRepository.find({
      relations: ['study_plans'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const career = await this.careerRepository.findOne({
      where: { id: id },
      relations: ['study_plans'],
    });

    if (!career) {
      throw new NotFoundException(`Carrera con ID ${id} no encontrada`);
    }

    return career;
  }

  async update(id: string, updateCareerDto: UpdateCareerDto) {
    const career = await this.careerRepository.preload({
      id: id,
      ...updateCareerDto,
    });

    if (!career) {
      throw new NotFoundException(`Carrera con ID ${id} no encontrada`);
    }

    return await this.careerRepository.save(career);
  }
}