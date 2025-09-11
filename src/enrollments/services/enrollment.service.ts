import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from '../dto';
import {
  PaginationDto,
  PaginatedResultDto,
  PaginationService,
} from '../../common';

@Injectable()
import { Student } from '../../auth/entities/student.entity';
import { Term } from '../../calendar/entities/term.entity';

export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    // Resolver student y term por códigos si corresponde
    let { student_id, term_id } = createEnrollmentDto;

    const usingIds = !!student_id && !!term_id;
    const usingCodes = !!createEnrollmentDto.student_code && !!createEnrollmentDto.term_name;

    if (!usingIds && !usingCodes) {
      throw new BadRequestException('Provide either (student_id, term_id) or (student_code, term_name)');
    }

    if (usingCodes) {
      const student = await this.studentRepository.findOne({
        where: { code: createEnrollmentDto.student_code! },
      });
      if (!student) {
        throw new NotFoundException(`Student with code '${createEnrollmentDto.student_code}' not found`);
      }
      const term = await this.termRepository.findOne({
        where: { name: createEnrollmentDto.term_name! },
      });
      if (!term) {
        throw new NotFoundException(`Term with name '${createEnrollmentDto.term_name}' not found`);
      }
      student_id = student.id;
      term_id = term.id;
    }

    const enrollment = this.enrollmentRepository.create({
      student_id: student_id!,
      term_id: term_id!,
      enrolled_on: createEnrollmentDto.enrolled_on,
      state: createEnrollmentDto.state ?? 'Active',
      origin: createEnrollmentDto.origin ?? 'Regular',
      note: createEnrollmentDto.note,
    });
    return await this.enrollmentRepository.save(enrollment);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResultDto<Enrollment>> {
    return this.paginationService.paginateRepository(
      this.enrollmentRepository,
      paginationDto,
      {
        relations: ['student', 'term', 'enrollment_details'],
        order: { enrolled_on: 'DESC' },
      },
    );
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
