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

  async create(createGradeDto: CreateGradeDto) {
    const grade = this.gradeRepository.create(createGradeDto);
    return await this.gradeRepository.save(grade);
  }

  async findAll() {
    return await this.gradeRepository.find({
      relations: ['detalle'],
      order: { fecha_registro: 'DESC' },
    });
  }

  async findOne(id: number) {
    const grade = await this.gradeRepository.findOne({
      where: { id_nota: id },
      relations: ['detalle'],
    });

    if (!grade) {
      throw new NotFoundException(`Nota con ID ${id} no encontrada`);
    }

    return grade;
  }

  async update(id: number, updateGradeDto: UpdateGradeDto) {
    const grade = await this.gradeRepository.preload({
      id_nota: id,
      ...updateGradeDto,
    });

    if (!grade) {
      throw new NotFoundException(`Nota con ID ${id} no encontrada`);
    }

    return await this.gradeRepository.save(grade);
  }
}