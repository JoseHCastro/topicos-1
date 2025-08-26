import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '../entities';
import { CreateLevelDto, UpdateLevelDto } from '../dto';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async create(createLevelDto: CreateLevelDto) {
    const level = this.levelRepository.create(createLevelDto);
    return await this.levelRepository.save(level);
  }

  async findAll() {
    return await this.levelRepository.find({
      order: { numero_nivel: 'ASC' },
    });
  }

  async findOne(id: number) {
    const level = await this.levelRepository.findOne({
      where: { id_nivel: id },
    });

    if (!level) {
      throw new NotFoundException(`Nivel con ID ${id} no encontrado`);
    }

    return level;
  }

  async update(id: number, updateLevelDto: UpdateLevelDto) {
    const level = await this.levelRepository.preload({
      id_nivel: id,
      ...updateLevelDto,
    });

    if (!level) {
      throw new NotFoundException(`Nivel con ID ${id} no encontrado`);
    }

    return await this.levelRepository.save(level);
  }
}