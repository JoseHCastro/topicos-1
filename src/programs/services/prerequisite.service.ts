import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prerequisite } from '../entities';
import { CreatePrerequisiteDto, UpdatePrerequisiteDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class PrerequisiteService {
  constructor(
    @InjectRepository(Prerequisite)
    private readonly prerequisiteRepository: Repository<Prerequisite>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createPrerequisiteDto: CreatePrerequisiteDto) {
    const prerequisite = this.prerequisiteRepository.create(
      createPrerequisiteDto,
    );
    return await this.prerequisiteRepository.save(prerequisite);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Prerequisite>> {
    return await this.paginationService.paginateRepository<Prerequisite>(
      this.prerequisiteRepository,
      paginationDto,
      {
        relations: ['main_course', 'required_course'],
        order: { created_at: 'DESC' },
      },
    );
  }

  async findOne(id: string) {
    const prerequisite = await this.prerequisiteRepository.findOne({
      where: { id: id },
      relations: ['main_course', 'required_course'],
    });

    if (!prerequisite) {
      throw new NotFoundException(`Prerequisito con ID ${id} no encontrado`);
    }

    return prerequisite;
  }

  async update(id: string, updatePrerequisiteDto: UpdatePrerequisiteDto) {
    const prerequisite = await this.prerequisiteRepository.preload({
      id: id,
      ...updatePrerequisiteDto,
    });

    if (!prerequisite) {
      throw new NotFoundException(`Prerequisito con ID ${id} no encontrado`);
    }

    return await this.prerequisiteRepository.save(prerequisite);
  }
}
