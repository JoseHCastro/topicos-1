import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseSection } from '../entities';
import { Course } from '../../programs/entities';
import { Term } from '../../calendar/entities';
import { Teacher } from '../../auth/entities/teacher.entity';
import { CreateCourseSectionDto, UpdateCourseSectionDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class CourseSectionService {
  constructor(
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(
    createCourseSectionDto: CreateCourseSectionDto,
  ): Promise<CourseSection> {
    // Resolver identificadores alternativos
    let { course_id, term_id, teacher_id } = createCourseSectionDto;

    const usingIds = !!course_id && !!term_id && !!teacher_id;
    const usingCodes =
      !!createCourseSectionDto.degree_program_code &&
      !!createCourseSectionDto.study_plan_version &&
      !!createCourseSectionDto.course_code &&
      !!createCourseSectionDto.term_name &&
      !!createCourseSectionDto.teacher_email;

    if (!usingIds && !usingCodes) {
      throw new BadRequestException(
        'Provide either IDs (course_id, term_id, teacher_id) or codes (degree_program_code, study_plan_version, course_code, term_name, teacher_email)'
      );
    }

    if (usingCodes) {
      // Encontrar course por (degree_program_code + study_plan_version + course_code)
      const { degree_program_code, study_plan_version, course_code } =
        createCourseSectionDto;

      const course = await this.courseRepository
        .createQueryBuilder('c')
        .innerJoin('c.study_plan', 'sp')
        .innerJoin('sp.degree_program', 'dp')
        .where('dp.code = :dpCode', { dpCode: degree_program_code })
        .andWhere('sp.version = :version', { version: study_plan_version })
        .andWhere('c.code = :courseCode', { courseCode: course_code })
        .getOne();

      if (!course) {
        throw new NotFoundException(
          `Course not found for degree_program_code='${degree_program_code}', study_plan_version='${study_plan_version}', course_code='${course_code}'`,
        );
      }

      const term = await this.termRepository.findOne({
        where: { name: createCourseSectionDto.term_name! },
      });
      if (!term) {
        throw new NotFoundException(
          `Term with name '${createCourseSectionDto.term_name}' not found`,
        );
      }

      const teacher = await this.teacherRepository.findOne({
        where: { email: createCourseSectionDto.teacher_email! },
      });
      if (!teacher) {
        throw new NotFoundException(
          `Teacher with email '${createCourseSectionDto.teacher_email}' not found`,
        );
      }

      course_id = course.id;
      term_id = term.id;
      teacher_id = teacher.id;
    }

    const courseSection = this.courseSectionRepository.create({
      course_id: course_id!,
      term_id: term_id!,
      teacher_id: teacher_id!,
      group_label: createCourseSectionDto.group_label,
      modality: createCourseSectionDto.modality,
      shift: createCourseSectionDto.shift,
      quota_max: createCourseSectionDto.quota_max,
      quota_available: createCourseSectionDto.quota_available,
    });
    return await this.courseSectionRepository.save(courseSection);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<CourseSection>> {
    return this.paginationService.paginateRepository(
      this.courseSectionRepository,
      paginationDto,
      {
        relations: ['course', 'term', 'teacher', 'schedules'],
      },
    );
  }

  async findOne(id: string): Promise<CourseSection> {
    const courseSection = await this.courseSectionRepository.findOne({
      where: { id },
      relations: ['course', 'term', 'teacher', 'schedules'],
    });
    if (!courseSection) {
      throw new NotFoundException(`Course Section with ID ${id} not found`);
    }
    return courseSection;
  }

  async update(
    id: string,
    updateCourseSectionDto: UpdateCourseSectionDto,
  ): Promise<CourseSection> {
    const courseSection = await this.findOne(id);
    Object.assign(courseSection, updateCourseSectionDto);
    return await this.courseSectionRepository.save(courseSection);
  }

  async remove(id: string): Promise<void> {
    const courseSection = await this.findOne(id);
    await this.courseSectionRepository.remove(courseSection);
  }
}
