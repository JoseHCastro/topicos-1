import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from '../entities';
import { CreateCareerDto, UpdateCareerDto } from '../dto';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
  ) {}

  async create(createCareerDto: CreateCareerDto) {
    const career = this.careerRepository.create(createCareerDto);
    return await this.careerRepository.save(career);
  }

  async findAll() {
    return await this.careerRepository.find({
      relations: ['planesEstudio'],
      order: { nombre_carrera: 'ASC' },
    });
  }

  async findOne(id: number) {
    const career = await this.careerRepository.findOne({
      where: { id_carrera: id },
      relations: ['planesEstudio'],
    });

    if (!career) {
      throw new NotFoundException(`Carrera con ID ${id} no encontrada`);
    }

    return career;
  }

  async update(id: number, updateCareerDto: UpdateCareerDto) {
    const career = await this.careerRepository.preload({
      id_carrera: id,
      ...updateCareerDto,
    });

    if (!career) {
      throw new NotFoundException(`Carrera con ID ${id} no encontrada`);
    }

    return await this.careerRepository.save(career);
  }
}