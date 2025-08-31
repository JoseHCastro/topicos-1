import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities';
import { CreateManagementDto, UpdateManagementDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class ManagementService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly managementRepository: Repository<AcademicYear>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createManagementDto: CreateManagementDto) {
    const management = this.managementRepository.create(createManagementDto);
    return await this.managementRepository.save(management);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<AcademicYear>> {
    return await this.paginationService.paginateRepository<AcademicYear>(
      this.managementRepository,
      paginationDto,
      {
        order: { year: 'DESC' },
      },
    );
  }

  async findOne(id: string) {
    const management = await this.managementRepository.findOne({
      where: { id: id },
    });

    if (!management) {
      throw new NotFoundException(`Gestión con ID ${id} no encontrada`);
    }

    return management;
  }

  async update(id: string, updateManagementDto: UpdateManagementDto) {
    const management = await this.managementRepository.preload({
      id: id,
      ...updateManagementDto,
    });

    if (!management) {
      throw new NotFoundException(`Gestión con ID ${id} no encontrada`);
    }

    return await this.managementRepository.save(management);
  }
}
