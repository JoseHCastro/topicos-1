import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DegreeProgram, StudyPlan } from '../entities';
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
    @InjectRepository(DegreeProgram)
    private readonly degreeProgramRepository: Repository<DegreeProgram>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createStudyPlanDto: CreateStudyPlanDto) {
    let degree_program_id = createStudyPlanDto.degree_program_id;

    if (!degree_program_id && createStudyPlanDto.degree_program_code) {
      const dp = await this.degreeProgramRepository.findOne({
        where: { code: createStudyPlanDto.degree_program_code },
      });
      if (!dp) {
        throw new NotFoundException(
          `DegreeProgram with code '${createStudyPlanDto.degree_program_code}' not found`,
        );
      }
      degree_program_id = dp.id;
    }

    if (!degree_program_id) {
      throw new BadRequestException(
        'Provide degree_program_id or degree_program_code',
      );
    }

    const studyPlan = this.studyPlanRepository.create({
      degree_program_id,
      version: createStudyPlanDto.version,
      is_current: createStudyPlanDto.is_current ?? false,
      valid_from: createStudyPlanDto.valid_from,
      valid_to: createStudyPlanDto.valid_to,
      resolution: createStudyPlanDto.resolution,
    });
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
      relations: ['degree_program', 'courses'],
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
