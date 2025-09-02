import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities';
import { CreateGradeDto, UpdateGradeDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createGradeDto: CreateGradeDto): Promise<Grade> {
    const grade = this.gradeRepository.create(createGradeDto);
    return await this.gradeRepository.save(grade);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Grade>> {
    return this.paginationService.paginateRepository(
      this.gradeRepository,
      paginationDto,
      {
        relations: ['course_section', 'student'],
      },
    );
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['course_section', 'student'],
    });
    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }
    return grade;
  }

  async findByStudent(
    studentId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Grade>> {
    return this.paginationService.paginateRepository(
      this.gradeRepository,
      paginationDto,
      {
        where: { student_id: studentId },
        relations: ['course_section', 'student'],
      },
    );
  }

  async findByCourseSection(
    courseSectionId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Grade>> {
    return this.paginationService.paginateRepository(
      this.gradeRepository,
      paginationDto,
      {
        where: { course_section_id: courseSectionId },
        relations: ['course_section', 'student'],
      },
    );
  }

  async update(id: string, updateGradeDto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.findOne(id);
    Object.assign(grade, updateGradeDto);
    return await this.gradeRepository.save(grade);
  }

  async remove(id: string): Promise<void> {
    const grade = await this.findOne(id);
    await this.gradeRepository.remove(grade);
  }
}
