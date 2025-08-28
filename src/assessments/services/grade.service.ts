import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities';
import { CreateGradeDto, UpdateGradeDto } from '../dto';

@Injectable()
export class GradeService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
  ) {}

  async create(createGradeDto: CreateGradeDto): Promise<Grade> {
    const grade = this.gradeRepository.create(createGradeDto);
    return await this.gradeRepository.save(grade);
  }

  async findAll(): Promise<Grade[]> {
    return await this.gradeRepository.find({
      relations: ['course_section', 'student'],
    });
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

  async findByStudent(studentId: string): Promise<Grade[]> {
    return await this.gradeRepository.find({
      where: { student_id: studentId },
      relations: ['course_section', 'student'],
    });
  }

  async findByCourseSection(courseSectionId: string): Promise<Grade[]> {
    return await this.gradeRepository.find({
      where: { course_section_id: courseSectionId },
      relations: ['course_section', 'student'],
    });
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