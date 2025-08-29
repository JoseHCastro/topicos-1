import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrollmentDetail } from '../entities';
import { CreateEnrollmentDetailDto, UpdateEnrollmentDetailDto } from '../dto';
import { PaginationDto, PaginatedResultDto, PaginationService } from '../../common';

@Injectable()
export class EnrollmentDetailService {
  constructor(
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createEnrollmentDetailDto: CreateEnrollmentDetailDto) {
    const enrollmentDetail = this.enrollmentDetailRepository.create(createEnrollmentDetailDto);
    return await this.enrollmentDetailRepository.save(enrollmentDetail);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<EnrollmentDetail>> {
    return this.paginationService.paginateRepository(
      this.enrollmentDetailRepository,
      paginationDto,
      {
        relations: ['enrollment', 'course_section'],
        order: { created_at: 'DESC' },
      }
    );
  }

  async findOne(id: string) {
    const enrollmentDetail = await this.enrollmentDetailRepository.findOne({
      where: { id: id },
      relations: ['enrollment', 'course_section'],
    });

    if (!enrollmentDetail) {
      throw new NotFoundException(`Detalle de inscripción con ID ${id} no encontrado`);
    }

    return enrollmentDetail;
  }

  async update(id: string, updateEnrollmentDetailDto: UpdateEnrollmentDetailDto) {
    const enrollmentDetail = await this.enrollmentDetailRepository.preload({
      id: id,
      ...updateEnrollmentDetailDto,
    });

    if (!enrollmentDetail) {
      throw new NotFoundException(`Detalle de inscripción con ID ${id} no encontrado`);
    }

    return await this.enrollmentDetailRepository.save(enrollmentDetail);
  }
}
