import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Management } from '../entities';
import { CreateManagementDto, UpdateManagementDto } from '../dto';

@Injectable()
export class ManagementService {
  constructor(
    @InjectRepository(Management)
    private readonly managementRepository: Repository<Management>,
  ) {}

  async create(createManagementDto: CreateManagementDto) {
    const management = this.managementRepository.create(createManagementDto);
    return await this.managementRepository.save(management);
  }

  async findAll() {
    return await this.managementRepository.find({
      order: { año: 'DESC' },
    });
  }

  async findOne(id: number) {
    const management = await this.managementRepository.findOne({
      where: { id_gestion: id },
    });

    if (!management) {
      throw new NotFoundException(`Gestión con ID ${id} no encontrada`);
    }

    return management;
  }

  async update(id: number, updateManagementDto: UpdateManagementDto) {
    const management = await this.managementRepository.preload({
      id_gestion: id,
      ...updateManagementDto,
    });

    if (!management) {
      throw new NotFoundException(`Gestión con ID ${id} no encontrada`);
    }

    return await this.managementRepository.save(management);
  }
}