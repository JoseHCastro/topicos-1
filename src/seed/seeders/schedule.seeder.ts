import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../../teaching/entities/schedule.entity';
import { CourseSection } from '../../teaching/entities/course-section.entity';
import { Classroom } from '../../facilities/entities/classroom.entity';
import { SeederInterface } from '../interfaces/seeder.interface';

@Injectable()
export class ScheduleSeeder implements SeederInterface {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(CourseSection)
    private readonly courseSectionRepository: Repository<CourseSection>,
    @InjectRepository(Classroom)
    private readonly classroomRepository: Repository<Classroom>,
  ) {}

  async run(): Promise<void> {
    console.log('Seeding schedules...');

    const courseSections = await this.courseSectionRepository.find({
      relations: ['course'],
    });

    const classrooms = await this.classroomRepository.find();

    if (courseSections.length === 0 || classrooms.length === 0) {
      console.log('Prerequisites not found for schedule seeding');
      return;
    }

    const morningSchedules = [
      { weekday: 'LUN', time_start: '07:00', time_end: '09:00' },
      { weekday: 'MIE', time_start: '07:00', time_end: '09:00' },
      { weekday: 'VIE', time_start: '07:00', time_end: '09:00' },
    ];

    const afternoonSchedules = [
      { weekday: 'LUN', time_start: '14:00', time_end: '16:00' },
      { weekday: 'MIE', time_start: '14:00', time_end: '16:00' },
      { weekday: 'VIE', time_start: '14:00', time_end: '16:00' },
    ];

    const eveningSchedules = [
      { weekday: 'MAR', time_start: '19:00', time_end: '21:00' },
      { weekday: 'JUE', time_start: '19:00', time_end: '21:00' },
    ];

    let classroomIndex = 0;

    for (const courseSection of courseSections) {
      let scheduleTemplate = morningSchedules;
      if (courseSection.shift === 'Tarde') {
        scheduleTemplate = afternoonSchedules;
      } else if (courseSection.shift === 'Noche') {
        scheduleTemplate = eveningSchedules;
      }

      const classroom = classrooms[classroomIndex % classrooms.length];
      classroomIndex++;

      for (const scheduleData of scheduleTemplate) {
        const existingSchedule = await this.scheduleRepository.findOne({
          where: {
            course_section_id: courseSection.id,
            weekday: scheduleData.weekday,
            time_start: scheduleData.time_start,
          },
        });

        if (!existingSchedule) {
          const schedule = this.scheduleRepository.create({
            course_section_id: courseSection.id,
            classroom_id: classroom.id,
            weekday: scheduleData.weekday,
            time_start: scheduleData.time_start,
            time_end: scheduleData.time_end,
            date_start: new Date('2025-02-01'),
            date_end: new Date('2025-06-30'),
          });

          await this.scheduleRepository.save(schedule);
          console.log(`Created schedule: ${courseSection.course?.code}-${courseSection.group_label} ${scheduleData.weekday} ${scheduleData.time_start}-${scheduleData.time_end} in ${classroom.code}`);
        } else {
          console.log(`Schedule already exists: ${courseSection.course?.code}-${courseSection.group_label} ${scheduleData.weekday}`);
        }
      }
    }

    console.log('Schedules seeding completed');
  }

  async clear(): Promise<void> {
    console.log('Clearing schedules...');
    await this.scheduleRepository.delete({});
    console.log('Schedules cleared');
  }
}
