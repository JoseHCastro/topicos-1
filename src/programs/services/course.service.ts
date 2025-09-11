import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';
import { DegreeProgram, Level, StudyPlan } from '../entities';
import { CreateCourseDto, UpdateCourseDto } from '../dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(DegreeProgram)
    private readonly degreeProgramRepository: Repository<DegreeProgram>,
    @InjectRepository(StudyPlan)
    private readonly studyPlanRepository: Repository<StudyPlan>,
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    // Soportar 2 modalidades: por IDs directos o por códigos de negocio
    let study_plan_id: string | undefined = createCourseDto.study_plan_id;
    let level_id: string | undefined = createCourseDto.level_id;

    const usingIds = !!study_plan_id && !!level_id;
    const usingCodes =
      !!createCourseDto.degree_program_code &&
      !!createCourseDto.study_plan_version &&
      typeof createCourseDto.level_order === 'number';

    if (!usingIds && !usingCodes) {
      throw new BadRequestException(
        'Provide either (study_plan_id, level_id) or (degree_program_code, study_plan_version, level_order)'
      );
    }

    if (usingCodes) {
      const degreeProgram = await this.degreeProgramRepository.findOne({
        where: { code: createCourseDto.degree_program_code! },
      });
      if (!degreeProgram) {
        throw new NotFoundException(
          `DegreeProgram with code '${createCourseDto.degree_program_code}' not found`,
        );
      }

      const studyPlan = await this.studyPlanRepository.findOne({
        where: {
          degree_program_id: degreeProgram.id,
          version: createCourseDto.study_plan_version!,
        },
      });
      if (!studyPlan) {
        throw new NotFoundException(
          `StudyPlan not found for degree_program_code '${createCourseDto.degree_program_code}' and version '${createCourseDto.study_plan_version}'`,
        );
      }

      const level = await this.levelRepository.findOne({
        where: { order: createCourseDto.level_order! },
      });
      if (!level) {
        throw new NotFoundException(
          `Level with order '${createCourseDto.level_order}' not found`,
        );
      }

      study_plan_id = studyPlan.id;
      level_id = level.id;
    }

    const course = this.courseRepository.create({
      study_plan_id: study_plan_id!,
      level_id: level_id!,
      code: createCourseDto.code,
      name: createCourseDto.name,
      credits: createCourseDto.credits,
      hours_theory: createCourseDto.hours_theory,
      hours_practice: createCourseDto.hours_practice,
      status: createCourseDto.status,
    });

    return await this.courseRepository.save(course);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Course>> {
    return this.paginationService.paginateRepository(
      this.courseRepository,
      paginationDto,
      {
        relations: [
          'study_plan',
          'level',
          'prerequisites_as_main',
          'prerequisites_as_required',
          'course_sections',
        ],
        order: { name: 'ASC' },
      },
    );
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id: id },
      relations: [
        'study_plan',
        'level',
        'prerequisites_as_main',
        'prerequisites_as_required',
        'course_sections',
      ],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepository.preload({
      id: id,
      ...updateCourseDto,
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return await this.courseRepository.save(course);
  }

  async remove(id: string) {
    const course = await this.findOne(id);
    return await this.courseRepository.remove(course);
  }
}
