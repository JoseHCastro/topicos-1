import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '../entities/level.entity';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async create(createLevelDto: any) {
    const level = this.levelRepository.create(createLevelDto);
    return await this.levelRepository.save(level);
  }

  async findAll() {
    return await this.levelRepository.find({
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string) {
    const level = await this.levelRepository.findOne({
      where: { id },
      relations: ['courses'],
    });
    
    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }
    
    return level;
  }

  async update(id: string, updateLevelDto: any) {
    const level = await this.levelRepository.preload({
      id,
      ...updateLevelDto,
    });
    
    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }
    
    return await this.levelRepository.save(level);
  }

  async remove(id: string) {
    const level = await this.findOne(id);
    return await this.levelRepository.remove(level);
  }
}
