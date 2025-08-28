import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyPlan } from '../entities';
import { CreateStudyPlanDto, UpdateStudyPlanDto } from '../dto';

@Injectable()
export class StudyPlanService {
  constructor(
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
  ) {}

  async create(createStudyPlanDto: CreateStudyPlanDto) {
    const studyPlan = this.studyPlanRepository.create(createStudyPlanDto);
    return await this.studyPlanRepository.save(studyPlan);
  }

  async findAll() {
    return await this.studyPlanRepository.find({
      relations: ['degree_program', 'courses'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const studyPlan = await this.studyPlanRepository.findOne({
      where: { id: id },
      relations: ['degree_program', 'courses'],
    });

    if (!studyPlan) {
      throw new NotFoundException(`Plan de estudio con ID ${id} no encontrado`);
    }

    return studyPlan;
  }

  async update(id: string, updateStudyPlanDto: UpdateStudyPlanDto) {
    const studyPlan = await this.studyPlanRepository.preload({
      id: id,
      ...updateStudyPlanDto,
    });

    if (!studyPlan) {
      throw new NotFoundException(`Plan de estudio con ID ${id} no encontrado`);
    }

    return await this.studyPlanRepository.save(studyPlan);
  }
}