import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../entities';
import { CreateClassroomDto, UpdateClassroomDto } from '../dto';

@Injectable()
export class ClassroomService {
  constructor(
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async create(createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    const classroom = this.classroomRepository.create(createClassroomDto);
    return await this.classroomRepository.save(classroom);
  }

  async findAll(): Promise<Classroom[]> {
    return await this.classroomRepository.find();
  }

  async findOne(id: string): Promise<Classroom> {
    const classroom = await this.classroomRepository.findOne({ where: { id } });
    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }
    return classroom;
  }

  async update(id: string, updateClassroomDto: UpdateClassroomDto): Promise<Classroom> {
    const classroom = await this.findOne(id);
    Object.assign(classroom, updateClassroomDto);
    return await this.classroomRepository.save(classroom);
  }

  async remove(id: string): Promise<void> {
    const classroom = await this.findOne(id);
    await this.classroomRepository.remove(classroom);
  }
}
