import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Course)
    private readonly subjectRepository: Repository<Course>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto) {
    const subject = this.subjectRepository.create(createSubjectDto);
    return await this.subjectRepository.save(subject);
  }

  async findAll() {
    return await this.subjectRepository.find({
      relations: ['study_plan', 'level', 'prerequisites_as_main'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const subject = await this.subjectRepository.findOne({
      where: { id: id },
      relations: ['study_plan', 'level', 'prerequisites_as_main'],
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.preload({
      id: id,
      ...updateSubjectDto,
    });

    if (!subject) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return await this.subjectRepository.save(subject);
  }
}