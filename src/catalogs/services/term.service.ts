import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from '../entities';
import { CreateTermDto, UpdateTermDto } from '../dto';

@Injectable()
export class TermService {
  constructor(
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
  ) {}

  async create(createTermDto: CreateTermDto) {
    const term = this.termRepository.create(createTermDto);
    return await this.termRepository.save(term);
  }

  async findAll() {
    return await this.termRepository.find({
      order: { year: 'DESC', number: 'ASC' },
    });
  }

  async findOne(id: string) {
    const term = await this.termRepository.findOne({
      where: { id },
    });

    if (!term) {
      throw new NotFoundException(`Término con ID ${id} no encontrado`);
    }

    return term;
  }

  async update(id: string, updateTermDto: UpdateTermDto) {
    const term = await this.termRepository.preload({
      id,
      ...updateTermDto,
    });

    if (!term) {
      throw new NotFoundException(`Término con ID ${id} no encontrado`);
    }

    return await this.termRepository.save(term);
  }
}