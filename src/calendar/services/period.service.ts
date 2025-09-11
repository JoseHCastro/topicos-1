import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear, Term } from '../entities';
import { CreatePeriodDto, UpdatePeriodDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
export class PeriodService {
  constructor(
    @InjectRepository(Term)
    private readonly periodRepository: Repository<Term>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepository: Repository<AcademicYear>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createPeriodDto: CreatePeriodDto) {
    let { academic_year_id } = createPeriodDto;
    if (!academic_year_id && createPeriodDto.year) {
      const ay = await this.academicYearRepository.findOne({
        where: { year: createPeriodDto.year },
      });
      if (!ay) {
        throw new NotFoundException(
          `AcademicYear with year '${createPeriodDto.year}' not found`,
        );
      }
      academic_year_id = ay.id;
    }

    if (!academic_year_id) {
      throw new BadRequestException('Provide academic_year_id or year');
    }

    const period = this.periodRepository.create({
      academic_year_id,
      name: createPeriodDto.name,
      start_date: createPeriodDto.start_date,
      end_date: createPeriodDto.end_date,
      status: createPeriodDto.status,
    });
    return await this.periodRepository.save(period);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Term>> {
    return await this.paginationService.paginateRepository<Term>(
      this.periodRepository,
      paginationDto,
      {
        relations: ['academic_year'],
        order: { start_date: 'DESC' },
      },
    );
  }

  async findOne(id: string) {
    const period = await this.periodRepository.findOne({
      where: { id: id },
      relations: ['academic_year'],
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${id} no encontrado`);
    }

    return period;
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto) {
    const period = await this.periodRepository.preload({
      id: id,
      ...updatePeriodDto,
    });

    if (!period) {
      throw new NotFoundException(`Período con ID ${id} no encontrado`);
    }

    return await this.periodRepository.save(period);
  }
}
