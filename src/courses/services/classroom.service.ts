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

  async create(createClassroomDto: CreateClassroomDto) {
    const classroom = this.classroomRepository.create(createClassroomDto);
    return await this.classroomRepository.save(classroom);
  }

  async findAll() {
    return await this.classroomRepository.find({
      order: { edificio: 'ASC', piso: 'ASC', nombre_aula: 'ASC' },
    });
  }

  async findOne(id: number) {
    const classroom = await this.classroomRepository.findOne({
      where: { id_aula: id },
    });

    if (!classroom) {
      throw new NotFoundException(`Aula con ID ${id} no encontrada`);
    }

    return classroom;
  }

  async update(id: number, updateClassroomDto: UpdateClassroomDto) {
    const classroom = await this.classroomRepository.preload({
      id_aula: id,
      ...updateClassroomDto,
    });

    if (!classroom) {
      throw new NotFoundException(`Aula con ID ${id} no encontrada`);
    }

    return await this.classroomRepository.save(classroom);
  }
}