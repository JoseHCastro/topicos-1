import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '../../courses/entities/schedule.entity';
import { SubjectGroup } from '../../courses/entities/subject-group.entity';
import { Classroom } from '../../courses/entities/classroom.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ScheduleSeeder implements SeederInterface {
  private readonly logger = new Logger(ScheduleSeeder.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(SubjectGroup)
    private readonly subjectGroupRepository: Repository<SubjectGroup>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🌱 Seeding schedules...');

    const subjectGroups = await this.subjectGroupRepository.find();
    const classrooms = await this.classroomRepository.find();

    if (subjectGroups.length === 0 || classrooms.length === 0) {
      this.logger.warn('⚠️ Missing required data (subject groups or classrooms), skipping schedules seeding');
      return;
    }

    const timeSlots = [
      { inicio: '07:00:00', fin: '08:30:00' },
      { inicio: '08:30:00', fin: '10:00:00' },
      { inicio: '10:00:00', fin: '11:30:00' },
      { inicio: '11:30:00', fin: '13:00:00' },
      { inicio: '14:00:00', fin: '15:30:00' },
      { inicio: '15:30:00', fin: '17:00:00' },
      { inicio: '17:00:00', fin: '18:30:00' },
      { inicio: '18:30:00', fin: '20:00:00' },
    ];

    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const classTypes = ['teorica', 'practica', 'laboratorio'];

    for (const subjectGroup of subjectGroups) {
      const classroomIndex = Math.floor(Math.random() * classrooms.length);
      const classroom = classrooms[classroomIndex];

      // Crear 2-3 horarios por grupo de materia
      const numSchedules = Math.floor(Math.random() * 2) + 2; // 2 o 3 horarios

      for (let i = 0; i < numSchedules; i++) {
        const dayIndex = Math.floor(Math.random() * days.length);
        const timeIndex = Math.floor(Math.random() * timeSlots.length);
        const classTypeIndex = Math.floor(Math.random() * classTypes.length);

        const scheduleData = {
          id_grupo_materia: subjectGroup.id_grupo_materia,
          id_aula: classroom.id_aula,
          dia_semana: days[dayIndex] as any,
          hora_inicio: timeSlots[timeIndex].inicio,
          hora_fin: timeSlots[timeIndex].fin,
          tipo_clase: classTypes[classTypeIndex] as any,
        };

        // Verificar que no exista un horario conflictivo
        const existingSchedule = await this.scheduleRepository.findOne({
          where: {
            id_grupo_materia: scheduleData.id_grupo_materia,
            dia_semana: scheduleData.dia_semana,
            hora_inicio: scheduleData.hora_inicio,
          },
        });

        if (!existingSchedule) {
          const schedule = this.scheduleRepository.create(scheduleData);
          await this.scheduleRepository.save(schedule);
          this.logger.log(`✅ Created schedule: Group ${subjectGroup.numero_grupo} - ${scheduleData.dia_semana} ${scheduleData.hora_inicio}`);
        } else {
          this.logger.log(`⚠️ Schedule conflict avoided for group ${subjectGroup.numero_grupo}`);
        }
      }
    }

    this.logger.log('✅ Schedules seeding completed');
  }

  async clear(): Promise<void> {
    this.logger.log('🧹 Clearing schedules...');
    await this.scheduleRepository.createQueryBuilder().delete().execute();
    this.logger.log('✅ Schedules cleared');
  }
}
