import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DegreeProgram } from '../entities';
import { CreateDegreeProgramDto, UpdateDegreeProgramDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class DegreeProgramService {
  constructor(
    @InjectRepository(DegreeProgram)
    private readonly degreeProgramRepository: Repository<DegreeProgram>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createDegreeProgramDto: CreateDegreeProgramDto) {
    const existing = await this.degreeProgramRepository.findOne({
      where: { code: createDegreeProgramDto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Degree Program with code '${createDegreeProgramDto.code}' already exists`,
      );
    }

    const degreeProgram = this.degreeProgramRepository.create(
      createDegreeProgramDto,
    );
    return await this.degreeProgramRepository.save(degreeProgram);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<DegreeProgram>> {
    return this.paginationService.paginateRepository(
      this.degreeProgramRepository,
      paginationDto,
      {
        relations: ['study_plans'],
        order: { name: 'ASC' },
      },
    );
  }

  async findOne(id: string) {
    const degreeProgram = await this.degreeProgramRepository.findOne({
      where: { id: id },
      relations: ['study_plans'],
    });

    if (!degreeProgram) {
      throw new NotFoundException(`Degree Program with ID ${id} not found`);
    }

    return degreeProgram;
  }

  async update(id: string, updateDegreeProgramDto: UpdateDegreeProgramDto) {
    const degreeProgram = await this.degreeProgramRepository.preload({
      id: id,
      ...updateDegreeProgramDto,
    });

    if (!degreeProgram) {
      throw new NotFoundException(`Degree Program with ID ${id} not found`);
    }

    return await this.degreeProgramRepository.save(degreeProgram);
  }

  async remove(id: string) {
    const degreeProgram = await this.findOne(id);
    return await this.degreeProgramRepository.remove(degreeProgram);
  }
}
