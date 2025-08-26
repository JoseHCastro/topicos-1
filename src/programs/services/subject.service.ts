import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../entities';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto) {
    const subject = this.subjectRepository.create(createSubjectDto);
    return await this.subjectRepository.save(subject);
  }

  async findAll() {
    return await this.subjectRepository.find({
      relations: ['planEstudio', 'nivel', 'prerequisitos'],
      order: { semestre_recomendado: 'ASC', nombre_materia: 'ASC' },
    });
  }

  async findOne(id: number) {
    const subject = await this.subjectRepository.findOne({
      where: { id_materia: id },
      relations: ['planEstudio', 'nivel', 'prerequisitos'],
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return subject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.preload({
      id_materia: id,
      ...updateSubjectDto,
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return await this.subjectRepository.save(subject);
  }
}