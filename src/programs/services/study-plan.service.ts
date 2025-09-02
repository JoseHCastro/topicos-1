import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyPlan } from '../entities';
import { CreateStudyPlanDto, UpdateStudyPlanDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class StudyPlanService {
  constructor(
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createStudyPlanDto: CreateStudyPlanDto) {
    const studyPlan = this.studyPlanRepository.create(createStudyPlanDto);
    return await this.studyPlanRepository.save(studyPlan);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<StudyPlan>> {
    return await this.paginationService.paginateRepository<StudyPlan>(
      this.studyPlanRepository,
      paginationDto,
      {
        relations: ['degree_program'],
        order: { created_at: 'DESC' },
      },
    );
  }

  async findOne(id: string) {
    const studyPlan = await this.studyPlanRepository.findOne({
      where: { id: id },
      relations: ['degree_program', 'study_plan_courses'],
    });

    if (!studyPlan) {
      throw new NotFoundException(
        `Plan de estudios con ID ${id} no encontrado`,
      );
    }

    return studyPlan;
  }

  async update(id: string, updateStudyPlanDto: UpdateStudyPlanDto) {
    const studyPlan = await this.studyPlanRepository.preload({
      id: id,
      ...updateStudyPlanDto,
    });

    if (!studyPlan) {
      throw new NotFoundException(
        `Plan de estudios con ID ${id} no encontrado`,
      );
    }

    return await this.studyPlanRepository.save(studyPlan);
  }
}
