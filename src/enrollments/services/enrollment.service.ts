import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from '../dto';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const enrollment = this.enrollmentRepository.create(createEnrollmentDto);
    return await this.enrollmentRepository.save(enrollment);
  }

  async findAll() {
    return await this.enrollmentRepository.find({
      relations: ['student', 'term', 'enrollment_details'],
      order: { enrolled_on: 'DESC' },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: id },
      relations: ['student', 'term', 'enrollment_details'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }

    return enrollment;
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    const enrollment = await this.enrollmentRepository.preload({
      id: id,
      ...updateEnrollmentDto,
    });

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`);
    }

    return await this.enrollmentRepository.save(enrollment);
  }
}