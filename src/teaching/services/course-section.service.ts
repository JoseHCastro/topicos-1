import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseSection } from '../entities';
import { CreateCourseSectionDto, UpdateCourseSectionDto } from '../dto';

@Injectable()
export class CourseSectionService {
  constructor(
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
  ) {}

  async create(createCourseSectionDto: CreateCourseSectionDto): Promise<CourseSection> {
    const courseSection = this.courseSectionRepository.create(createCourseSectionDto);
    return await this.courseSectionRepository.save(courseSection);
  }

  async findAll(): Promise<CourseSection[]> {
    return await this.courseSectionRepository.find({
      relations: ['course', 'term', 'teacher', 'schedules'],
    });
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

  async update(id: string, updateCourseSectionDto: UpdateCourseSectionDto): Promise<CourseSection> {
    const courseSection = await this.findOne(id);
    Object.assign(courseSection, updateCourseSectionDto);
    return await this.courseSectionRepository.save(courseSection);
  }

  async remove(id: string): Promise<void> {
    const courseSection = await this.findOne(id);
    await this.courseSectionRepository.remove(courseSection);
  }
}
