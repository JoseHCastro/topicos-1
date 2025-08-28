import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DegreeProgram } from '../entities';

@Injectable()
export class DegreeProgramService {
  constructor(
    @InjectRepository(DegreeProgram)
    private readonly degreeProgramRepository: Repository<DegreeProgram>,
  ) {}

  async create(createDegreeProgramDto: any) {
    const degreeProgram = this.degreeProgramRepository.create(createDegreeProgramDto);
    return await this.degreeProgramRepository.save(degreeProgram);
  }

  async findAll() {
    return await this.degreeProgramRepository.find({
      relations: ['study_plans'],
      order: { name: 'ASC' },
    });
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

  async update(id: string, updateDegreeProgramDto: any) {
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