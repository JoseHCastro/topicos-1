import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EnrollmentDetail } from '../../enrollments/entities/enrollment-detail.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { SubjectGroup } from '../../courses/entities/subject-group.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class EnrollmentDetailSeeder implements SeederInterface {
  private readonly logger = new Logger(EnrollmentDetailSeeder.name);

  constructor(
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(SubjectGroup)
    private readonly subjectGroupRepository: Repository<SubjectGroup>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding enrollment details...');

    const enrollments = await this.enrollmentRepository.find({
      where: { estado: 'activa' }
    });
    const subjectGroups = await this.subjectGroupRepository.find({
      where: { estado: 'abierto' }
    });

    if (enrollments.length === 0 || subjectGroups.length === 0) {
      this.logger.warn('⚠️ Missing required data (active enrollments or open subject groups), skipping enrollment details seeding');
      return;
    }

    const detailStates = ['inscrito', 'aprobado', 'reprobado'];

    // Crear detalles para cada inscripción activa
    for (const enrollment of enrollments) {
      // Cada estudiante se inscribe en 3-5 materias
      const numSubjects = Math.floor(Math.random() * 3) + 3; // 3 a 5 materias
      const selectedGroups = this.getRandomSubjects(subjectGroups, numSubjects);

      for (const subjectGroup of selectedGroups) {
        const stateIndex = Math.floor(Math.random() * detailStates.length);

        const detailData = {
          id_inscripcion: enrollment.id_inscripcion,
          id_grupo_materia: subjectGroup.id_grupo_materia,
          fecha_inscripcion_materia: new Date(),
          estado_materia: detailStates[stateIndex] as any,
        };

        const existingDetail = await this.enrollmentDetailRepository.findOne({
          where: {
            id_inscripcion: detailData.id_inscripcion,
            id_grupo_materia: detailData.id_grupo_materia,
          },
        });

        if (!existingDetail) {
          const enrollmentDetail = this.enrollmentDetailRepository.create(detailData);
          await this.enrollmentDetailRepository.save(enrollmentDetail);
          this.logger.log(`✅ Created enrollment detail: Enrollment ${enrollment.id_inscripcion} - Group ${subjectGroup.numero_grupo}`);

          // Actualizar cupo actual del grupo
          subjectGroup.cupo_actual += 1;
          await this.subjectGroupRepository.save(subjectGroup);
        } else {
          this.logger.log(`⚠️ Enrollment detail already exists: Enrollment ${enrollment.id_inscripcion} - Group ${subjectGroup.numero_grupo}`);
        }
      }
    }

    this.logger.log('✅ Enrollment details seeding completed');
  }

  private getRandomSubjects(subjectGroups: SubjectGroup[], count: number): SubjectGroup[] {
    const shuffled = [...subjectGroups].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing enrollment details...');
    await this.enrollmentDetailRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Enrollment details cleared');
  }
}
