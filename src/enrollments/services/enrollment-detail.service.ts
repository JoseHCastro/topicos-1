import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrollmentDetail } from '../entities';
import { CreateEnrollmentDetailDto, UpdateEnrollmentDetailDto } from '../dto';

@Injectable()
export class EnrollmentDetailService {
  constructor(
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
  ) {}

  async create(createEnrollmentDetailDto: CreateEnrollmentDetailDto) {
    const enrollmentDetail = this.enrollmentDetailRepository.create(createEnrollmentDetailDto);
    return await this.enrollmentDetailRepository.save(enrollmentDetail);
  }

  async findAll() {
    return await this.enrollmentDetailRepository.find({
      relations: ['inscripcion', 'grupoMateria'],
      order: { fecha_inscripcion_materia: 'DESC' },
    });
  }

  async findOne(id: number) {
    const enrollmentDetail = await this.enrollmentDetailRepository.findOne({
      where: { id_detalle: id },
      relations: ['inscripcion', 'grupoMateria'],
    });

    if (!enrollmentDetail) {
      throw new NotFoundException(`Detalle de inscripción con ID ${id} no encontrado`);
    }

    return enrollmentDetail;
  }

  async update(id: number, updateEnrollmentDetailDto: UpdateEnrollmentDetailDto) {
    const enrollmentDetail = await this.enrollmentDetailRepository.preload({
      id_detalle: id,
      ...updateEnrollmentDetailDto,
    });

    if (!enrollmentDetail) {
      throw new NotFoundException(`Detalle de inscripción con ID ${id} no encontrado`);
    }

    return await this.enrollmentDetailRepository.save(enrollmentDetail);
  }
}