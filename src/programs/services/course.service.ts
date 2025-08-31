import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createCourseDto: any) {
    const course = this.courseRepository.create(createCourseDto);
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

  async update(id: string, updateCourseDto: any) {
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
