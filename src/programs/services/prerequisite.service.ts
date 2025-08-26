import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prerequisite } from '../entities';
import { CreatePrerequisiteDto, UpdatePrerequisiteDto } from '../dto';

@Injectable()
export class PrerequisiteService {
  constructor(
    @InjectRepository(Prerequisite)
    private readonly prerequisiteRepository: Repository<Prerequisite>,
  ) {}

  async create(createPrerequisiteDto: CreatePrerequisiteDto) {
    const prerequisite = this.prerequisiteRepository.create(createPrerequisiteDto);
    return await this.prerequisiteRepository.save(prerequisite);
  }

  async findAll() {
    return await this.prerequisiteRepository.find({
      relations: ['materia', 'materiaPrerequisito'],
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findOne(id: number) {
    const prerequisite = await this.prerequisiteRepository.findOne({
      where: { id_prerequisito: id },
      relations: ['materia', 'materiaPrerequisito'],
    });

    if (!prerequisite) {
      throw new NotFoundException(`Prerequisito con ID ${id} no encontrado`);
    }

    return prerequisite;
  }

  async update(id: number, updatePrerequisiteDto: UpdatePrerequisiteDto) {
    const prerequisite = await this.prerequisiteRepository.preload({
      id_prerequisito: id,
      ...updatePrerequisiteDto,
    });

    if (!prerequisite) {
      throw new NotFoundException(`Prerequisito con ID ${id} no encontrado`);
    }

    return await this.prerequisiteRepository.save(prerequisite);
  }
}