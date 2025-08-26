import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Grade } from '../../grades/entities/grade.entity';
import { EnrollmentDetail } from '../../enrollments/entities/enrollment-detail.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class GradeSeeder implements SeederInterface {
  private readonly logger = new Logger(GradeSeeder.name);

  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(EnrollmentDetail)
    private readonly enrollmentDetailRepository: Repository<EnrollmentDetail>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding grades...');

    const enrollmentDetails = await this.enrollmentDetailRepository.find({
      where: { estado_materia: 'inscrito' }
    });

    if (enrollmentDetails.length === 0) {
      this.logger.warn('⚠️ No enrolled subjects found, skipping grades seeding');
      return;
    }

    for (const enrollmentDetail of enrollmentDetails) {
      const existingGrade = await this.gradeRepository.findOne({
        where: { detalle: { id_detalle: enrollmentDetail.id_detalle } },
        relations: ['detalle']
      });

      if (!existingGrade) {
        // Generar notas aleatorias realistas
        const primerParcial = this.generateRandomGrade();
        const segundoParcial = this.generateRandomGrade();
        const examenFinal = this.generateRandomGrade();
        const trabajosPracticos = this.generateRandomGrade();

        // Calcular nota final (promedio ponderado)
        const notaFinal = this.calculateFinalGrade(
          primerParcial,
          segundoParcial,
          examenFinal,
          trabajosPracticos
        );

        const gradeData = {
          primer_parcial: primerParcial,
          segundo_parcial: segundoParcial,
          examen_final: examenFinal,
          trabajos_practicos: trabajosPracticos,
          nota_final: notaFinal,
          observaciones: notaFinal >= 51 ? 'Aprobado' : 'Reprobado',
          fecha_registro: new Date(),
          detalle: enrollmentDetail,
        };

        const grade = this.gradeRepository.create(gradeData);
        await this.gradeRepository.save(grade);

        // Actualizar estado del detalle de inscripción
        enrollmentDetail.estado_materia = notaFinal >= 51 ? 'aprobado' : 'reprobado';
        await this.enrollmentDetailRepository.save(enrollmentDetail);

        this.logger.log(`✅ Created grade for enrollment detail ${enrollmentDetail.id_detalle}: ${notaFinal.toFixed(2)}`);
      } else {
        this.logger.log(`⚠️ Grade already exists for enrollment detail ${enrollmentDetail.id_detalle}`);
      }
    }

    this.logger.log('✅ Grades seeding completed');
  }

  private generateRandomGrade(): number {
    // Generar notas entre 0 y 100, con tendencia hacia valores medios
    const random = Math.random();
    if (random < 0.1) return Math.floor(Math.random() * 30); // 10% notas bajas (0-29)
    if (random < 0.3) return Math.floor(Math.random() * 21) + 30; // 20% notas regulares (30-50)
    if (random < 0.7) return Math.floor(Math.random() * 25) + 51; // 40% notas buenas (51-75)
    return Math.floor(Math.random() * 25) + 76; // 30% notas altas (76-100)
  }

  private calculateFinalGrade(
    primerParcial: number,
    segundoParcial: number,
    examenFinal: number,
    trabajosPracticos: number
  ): number {
    // Ponderación: 25% primer parcial, 25% segundo parcial, 30% examen final, 20% trabajos prácticos
    const finalGrade = (
      primerParcial * 0.25 +
      segundoParcial * 0.25 +
      examenFinal * 0.30 +
      trabajosPracticos * 0.20
    );
    
    return Math.round(finalGrade * 100) / 100; // Redondear a 2 decimales
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing grades...');
    await this.gradeRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Grades cleared');
  }
}
