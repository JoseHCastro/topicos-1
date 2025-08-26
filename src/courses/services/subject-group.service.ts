import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectGroup } from '../entities';
import { CreateSubjectGroupDto, UpdateSubjectGroupDto } from '../dto';

@Injectable()
export class SubjectGroupService {
  constructor(
    @InjectRepository(SubjectGroup)
    private readonly subjectGroupRepository: Repository<SubjectGroup>,
  ) {}

  async create(createSubjectGroupDto: CreateSubjectGroupDto) {
    const subjectGroup = this.subjectGroupRepository.create(createSubjectGroupDto);
    return await this.subjectGroupRepository.save(subjectGroup);
  }

  async findAll() {
    return await this.subjectGroupRepository.find({
      relations: ['materia', 'profesor', 'periodo', 'aula', 'horarios'],
      order: { numero_grupo: 'ASC' },
    });
  }

  async findOne(id: number) {
    const subjectGroup = await this.subjectGroupRepository.findOne({
      where: { id_grupo_materia: id },
      relations: ['materia', 'profesor', 'periodo', 'aula', 'horarios'],
    });

    if (!subjectGroup) {
      throw new NotFoundException(`Grupo de materia con ID ${id} no encontrado`);
    }

    return subjectGroup;
  }

  async update(id: number, updateSubjectGroupDto: UpdateSubjectGroupDto) {
    const subjectGroup = await this.subjectGroupRepository.preload({
      id_grupo_materia: id,
      ...updateSubjectGroupDto,
    });

    if (!subjectGroup) {
      throw new NotFoundException(`Grupo de materia con ID ${id} no encontrado`);
    }

    return await this.subjectGroupRepository.save(subjectGroup);
  }
}