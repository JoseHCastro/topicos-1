import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Entities
import { User } from '../auth/entities/user.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Professor, ProfessorStatus } from '../auth/entities/professor.entity';
import { Student, StudentStatus } from '../auth/entities/student.entity';
import { Level } from '../catalogs/entities/level.entity';
import { Term } from '../catalogs/entities/term.entity';
import { Career } from '../programs/entities/career.entity';
import { StudyPlan } from '../programs/entities/study-plan.entity';
import { Subject } from '../programs/entities/subject.entity';
import { Prerequisite } from '../programs/entities/prerequisite.entity';
import { Management } from '../academic-calendar/entities/management.entity';
import { Period } from '../academic-calendar/entities/period.entity';
import { Classroom } from '../courses/entities/classroom.entity';
import { SubjectGroup } from '../courses/entities/subject-group.entity';
import { Schedule } from '../courses/entities/schedule.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { EnrollmentDetail } from '../enrollments/entities/enrollment-detail.entity';
import { Grade } from '../grades/entities/grade.entity';

export class DatabaseSeeder {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async seed() {
    console.log('🌱 Iniciando el proceso de seeding...');

    // Limpiar datos existentes (opcional)
    await this.clearDatabase();

    // Crear datos base
    const levels = await this.seedLevels();
    const terms = await this.seedTerms();
    const careers = await this.seedCareers();
    const studyPlans = await this.seedStudyPlans(careers);
    const subjects = await this.seedSubjects(studyPlans, levels);
    await this.seedPrerequisites(subjects);
    
    const managements = await this.seedManagements();
    const periods = await this.seedPeriods(managements);
    
    const classrooms = await this.seedClassrooms();
    
    // Crear usuarios
    const admins = await this.seedAdmins();
    const professors = await this.seedProfessors();
    const students = await this.seedStudents(careers);
    
    // Crear grupos de materias y horarios
    const subjectGroups = await this.seedSubjectGroups(subjects, professors, periods, classrooms);
    await this.seedSchedules(subjectGroups, classrooms);
    
    // Crear inscripciones y notas
    const enrollments = await this.seedEnrollments(students, periods);
    const enrollmentDetails = await this.seedEnrollmentDetails(enrollments, subjectGroups);
    await this.seedGrades(enrollmentDetails);

    console.log('✅ Seeding completado exitosamente!');
  }

  private async clearDatabase() {
    console.log('🧹 Limpiando datos existentes...');
    
    const entities = [
      Grade, EnrollmentDetail, Enrollment, Schedule, SubjectGroup,
      Prerequisite, Subject, StudyPlan, Student, Professor, Admin,
      Classroom, Period, Management, Career, Term, Level
    ];

    for (const entity of entities) {
      try {
        const repository = this.dataSource.getRepository(entity);
        const count = await repository.count();
        if (count > 0) {
          await repository.clear();
          console.log(`   ✓ Limpiados ${count} registros de ${entity.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error al limpiar ${entity.name}:`, error.message);
      }
    }
  }

  private async seedLevels() {
    console.log('📚 Creando niveles...');
    
    const levelRepository = this.dataSource.getRepository(Level);
    const levelsData = [
      { numero_nivel: 1, nombre_nivel: 'Primer Año', descripcion: 'Materias básicas del primer año de carrera' },
      { numero_nivel: 2, nombre_nivel: 'Segundo Año', descripcion: 'Materias del segundo año con mayor especialización' },
      { numero_nivel: 3, nombre_nivel: 'Tercer Año', descripcion: 'Materias intermedias de especialización' },
      { numero_nivel: 4, nombre_nivel: 'Cuarto Año', descripcion: 'Materias avanzadas de la carrera' },
      { numero_nivel: 5, nombre_nivel: 'Quinto Año', descripcion: 'Materias de especialización final y tesis' },
    ];

    const levels = levelRepository.create(levelsData);
    return await levelRepository.save(levels);
  }

  private async seedTerms() {
    console.log('🗓️ Creando términos...');
    
    const termRepository = this.dataSource.getRepository(Term);
    const termsData = [
      { year: '2024', number: 1, name: 'Primer Término', isActive: false },
      { year: '2024', number: 2, name: 'Segundo Término', isActive: false },
      { year: '2025', number: 1, name: 'Primer Término', isActive: true },
      { year: '2025', number: 2, name: 'Segundo Término', isActive: false },
    ];

    const terms = termRepository.create(termsData);
    return await termRepository.save(terms);
  }

  private async seedCareers() {
    console.log('🎓 Creando carreras...');
    
    const careerRepository = this.dataSource.getRepository(Career);
    const careersData = [
      {
        codigo_carrera: 'ING001',
        nombre_carrera: 'Ingeniería en Sistemas',
        descripcion: 'Carrera enfocada en el desarrollo de software y sistemas informáticos',
        duracion_semestres: 10,
        titulo_otorgado: 'Ingeniero',
        modalidad: 'presencial',
        estado: 'activa'
      },
      {
        codigo_carrera: 'ING002',
        nombre_carrera: 'Ingeniería Civil',
        descripcion: 'Carrera enfocada en la construcción y diseño de infraestructuras',
        duracion_semestres: 10,
        titulo_otorgado: 'Ingeniero',
        modalidad: 'presencial',
        estado: 'activa'
      },
      {
        codigo_carrera: 'MED001',
        nombre_carrera: 'Medicina',
        descripcion: 'Carrera de medicina general',
        duracion_semestres: 12,
        titulo_otorgado: 'Médico',
        modalidad: 'presencial',
        estado: 'activa'
      },
      {
        codigo_carrera: 'ADM001',
        nombre_carrera: 'Administración de Empresas',
        descripcion: 'Carrera enfocada en la gestión empresarial',
        duracion_semestres: 8,
        titulo_otorgado: 'Licenciado',
        modalidad: 'presencial',
        estado: 'activa'
      }
    ];

    const careers = careerRepository.create(careersData);
    return await careerRepository.save(careers);
  }

  private async seedStudyPlans(careers: Career[]) {
    console.log('📋 Creando planes de estudio...');
    
    const studyPlanRepository = this.dataSource.getRepository(StudyPlan);
    const studyPlansData = careers.map(career => ({
      id_carrera: career.id_carrera,
      version: '2023-1',
      año_aprobacion: 2023,
      creditos_totales: 240,
      fecha_inicio_vigencia: new Date('2023-01-01'),
      fecha_fin_vigencia: new Date('2028-12-31'),
      estado: 'vigente',
      carrera: career
    }));

    const studyPlans = studyPlanRepository.create(studyPlansData);
    return await studyPlanRepository.save(studyPlans);
  }

  private async seedSubjects(studyPlans: StudyPlan[], levels: Level[]) {
    console.log('📖 Creando materias...');
    
    const subjectRepository = this.dataSource.getRepository(Subject);
    const subjects = [];

    // Materias para Ingeniería en Sistemas
    const systemsSubjects = [
      {
        codigo_materia: 'SIS101',
        nombre_materia: 'Introducción a la Programación',
        descripcion: 'Fundamentos de programación con algoritmos básicos',
        creditos: 6,
        horas_teoricas: 4,
        horas_practicas: 2,
        horas_laboratorio: 2,
        semestre_recomendado: 1,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[0]
      },
      {
        codigo_materia: 'SIS102',
        nombre_materia: 'Matemáticas Discretas',
        descripcion: 'Matemáticas aplicadas a ciencias de la computación',
        creditos: 5,
        horas_teoricas: 4,
        horas_practicas: 1,
        horas_laboratorio: 0,
        semestre_recomendado: 1,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[0]
      },
      {
        codigo_materia: 'SIS201',
        nombre_materia: 'Programación Orientada a Objetos',
        descripcion: 'Paradigma de programación orientada a objetos',
        creditos: 6,
        horas_teoricas: 4,
        horas_practicas: 2,
        horas_laboratorio: 2,
        semestre_recomendado: 3,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[1]
      },
      {
        codigo_materia: 'SIS202',
        nombre_materia: 'Estructura de Datos',
        descripcion: 'Estructuras de datos y algoritmos fundamentales',
        creditos: 6,
        horas_teoricas: 4,
        horas_practicas: 2,
        horas_laboratorio: 2,
        semestre_recomendado: 3,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[1]
      },
      {
        codigo_materia: 'SIS301',
        nombre_materia: 'Base de Datos',
        descripcion: 'Diseño y administración de bases de datos',
        creditos: 6,
        horas_teoricas: 3,
        horas_practicas: 2,
        horas_laboratorio: 3,
        semestre_recomendado: 5,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[2]
      },
      {
        codigo_materia: 'SIS401',
        nombre_materia: 'Ingeniería de Software',
        descripcion: 'Metodologías para el desarrollo de software',
        creditos: 7,
        horas_teoricas: 4,
        horas_practicas: 3,
        horas_laboratorio: 2,
        semestre_recomendado: 7,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[3]
      }
    ];

    // Materias para Medicina
    const medicineSubjects = [
      {
        codigo_materia: 'MED101',
        nombre_materia: 'Anatomía Humana',
        descripcion: 'Estudio de la estructura del cuerpo humano',
        creditos: 8,
        horas_teoricas: 5,
        horas_practicas: 3,
        horas_laboratorio: 4,
        semestre_recomendado: 1,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[2],
        nivel: levels[0]
      },
      {
        codigo_materia: 'MED102',
        nombre_materia: 'Bioquímica',
        descripcion: 'Procesos químicos en los organismos vivos',
        creditos: 6,
        horas_teoricas: 4,
        horas_practicas: 2,
        horas_laboratorio: 3,
        semestre_recomendado: 2,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[2],
        nivel: levels[0]
      }
    ];

    // Materias generales
    const generalSubjects = [
      {
        codigo_materia: 'GEN101',
        nombre_materia: 'Física I',
        descripcion: 'Mecánica clásica y ondas',
        creditos: 5,
        horas_teoricas: 4,
        horas_practicas: 1,
        horas_laboratorio: 2,
        semestre_recomendado: 1,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[0]
      },
      {
        codigo_materia: 'GEN102',
        nombre_materia: 'Cálculo I',
        descripcion: 'Límites, derivadas e integrales',
        creditos: 6,
        horas_teoricas: 5,
        horas_practicas: 1,
        horas_laboratorio: 0,
        semestre_recomendado: 1,
        es_obligatoria: true,
        estado: 'activa',
        planEstudio: studyPlans[0],
        nivel: levels[0]
      }
    ];

    const allSubjects = [...systemsSubjects, ...medicineSubjects, ...generalSubjects];
    const createdSubjects = subjectRepository.create(allSubjects);
    return await subjectRepository.save(createdSubjects);
  }

  private async seedPrerequisites(subjects: Subject[]) {
    console.log('🔗 Creando prerequisitos...');
    
    const prerequisiteRepository = this.dataSource.getRepository(Prerequisite);
    const prerequisites: Partial<Prerequisite>[] = [];

    // POO requiere Introducción a la Programación
    const introProg = subjects.find(s => s.codigo_materia === 'SIS101');
    const poo = subjects.find(s => s.codigo_materia === 'SIS201');
    if (introProg && poo) {
      prerequisites.push({
        id_materia: poo.id_materia,
        id_materia_prerequisito: introProg.id_materia,
        tipo_prerequisito: 'obligatorio',
        materia: poo,
        materiaPrerequisito: introProg
      });
    }

    // Estructura de datos requiere POO
    const estructuraDatos = subjects.find(s => s.codigo_materia === 'SIS202');
    if (poo && estructuraDatos) {
      prerequisites.push({
        id_materia: estructuraDatos.id_materia,
        id_materia_prerequisito: poo.id_materia,
        tipo_prerequisito: 'obligatorio',
        materia: estructuraDatos,
        materiaPrerequisito: poo
      });
    }

    // Base de datos requiere Estructura de datos
    const baseDatos = subjects.find(s => s.codigo_materia === 'SIS301');
    if (estructuraDatos && baseDatos) {
      prerequisites.push({
        id_materia: baseDatos.id_materia,
        id_materia_prerequisito: estructuraDatos.id_materia,
        tipo_prerequisito: 'obligatorio',
        materia: baseDatos,
        materiaPrerequisito: estructuraDatos
      });
    }

    if (prerequisites.length > 0) {
      const createdPrerequisites = prerequisiteRepository.create(prerequisites);
      return await prerequisiteRepository.save(createdPrerequisites);
    }
    return [];
  }

  private async seedManagements() {
    console.log('📅 Creando gestiones...');
    
    const managementRepository = this.dataSource.getRepository(Management);
    const managementsData = [
      {
        año: 2024,
        descripcion: 'Gestión Académica 2024',
        fecha_inicio: new Date('2024-01-15'),
        fecha_fin: new Date('2024-12-15'),
        estado: 'finalizada'
      },
      {
        año: 2025,
        descripcion: 'Gestión Académica 2025',
        fecha_inicio: new Date('2025-01-15'),
        fecha_fin: new Date('2025-12-15'),
        estado: 'activa'
      }
    ];

    const managements = managementRepository.create(managementsData);
    return await managementRepository.save(managements);
  }

  private async seedPeriods(managements: Management[]) {
    console.log('📆 Creando períodos...');
    
    const periodRepository = this.dataSource.getRepository(Period);
    const periods: Partial<Period>[] = [];

    // Períodos para 2025
    const management2025 = managements.find(m => m.año === 2025);
    if (management2025) {
      periods.push(
        {
          id_gestion: management2025.id_gestion,
          numero_periodo: 1,
          nombre_periodo: 'Primer Semestre 2025',
          fecha_inicio: new Date('2025-02-01'),
          fecha_fin: new Date('2025-06-30'),
          fecha_inicio_inscripciones: new Date('2025-01-15'),
          fecha_fin_inscripciones: new Date('2025-01-31'),
          estado: 'activo',
          gestion: management2025
        },
        {
          id_gestion: management2025.id_gestion,
          numero_periodo: 2,
          nombre_periodo: 'Segundo Semestre 2025',
          fecha_inicio: new Date('2025-08-01'),
          fecha_fin: new Date('2025-12-15'),
          fecha_inicio_inscripciones: new Date('2025-07-15'),
          fecha_fin_inscripciones: new Date('2025-07-31'),
          estado: 'planificado',
          gestion: management2025
        }
      );
    }

    const createdPeriods = periodRepository.create(periods);
    return await periodRepository.save(createdPeriods);
  }

  private async seedClassrooms() {
    console.log('🏫 Creando aulas...');
    
    const classroomRepository = this.dataSource.getRepository(Classroom);
    const classroomsData = [
      {
        codigo_aula: 'A101',
        nombre_aula: 'Aula Magna 101',
        capacidad: 80,
        edificio: 'Edificio A',
        piso: 1,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, aire acondicionado, pizarra digital',
        estado: 'disponible'
      },
      {
        codigo_aula: 'A201',
        nombre_aula: 'Aula 201',
        capacidad: 40,
        edificio: 'Edificio A',
        piso: 2,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, aire acondicionado',
        estado: 'disponible'
      },
      {
        codigo_aula: 'B101',
        nombre_aula: 'Laboratorio de Sistemas',
        capacidad: 30,
        edificio: 'Edificio B',
        piso: 1,
        tipo_aula: 'laboratorio',
        equipamiento: '30 computadoras, servidor, aire acondicionado',
        estado: 'disponible'
      },
      {
        codigo_aula: 'B201',
        nombre_aula: 'Laboratorio de Física',
        capacidad: 25,
        edificio: 'Edificio B',
        piso: 2,
        tipo_aula: 'laboratorio',
        equipamiento: 'Equipos de laboratorio, instrumentos de medición',
        estado: 'disponible'
      },
      {
        codigo_aula: 'C101',
        nombre_aula: 'Aula 301',
        capacidad: 35,
        edificio: 'Edificio C',
        piso: 1,
        tipo_aula: 'tradicional',
        equipamiento: 'Proyector, pizarra',
        estado: 'disponible'
      }
    ];

    const classrooms = classroomRepository.create(classroomsData);
    return await classroomRepository.save(classrooms);
  }

  private async seedAdmins() {
    console.log('👥 Creando administradores...');
    
    const adminRepository = this.dataSource.getRepository(Admin);
    const adminsData = [
      {
        email: 'admin@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Carlos',
        lastName: 'Mendoza',
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date()
      },
      {
        email: 'secretaria@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'María',
        lastName: 'González',
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date()
      }
    ];

    const admins = adminRepository.create(adminsData);
    return await adminRepository.save(admins);
  }

  private async seedProfessors() {
    console.log('👨‍🏫 Creando profesores...');
    
    const professorRepository = this.dataSource.getRepository(Professor);
    const professorsData = [
      {
        email: 'jperez@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'PROFESSOR',
        professorCode: 'PROF001',
        nationalId: '12345678',
        birthDate: new Date('1980-05-15'),
        phone: '70123456',
        department: 'Sistemas',
        status: ProfessorStatus.ACTIVE
      },
      {
        email: 'mmartinez@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'María',
        lastName: 'Martínez',
        role: 'PROFESSOR',
        professorCode: 'PROF002',
        nationalId: '87654321',
        birthDate: new Date('1975-08-22'),
        phone: '70987654',
        department: 'Matemáticas',
        status: ProfessorStatus.ACTIVE
      },
      {
        email: 'arodriguez@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Ana',
        lastName: 'Rodríguez',
        role: 'PROFESSOR',
        professorCode: 'PROF003',
        nationalId: '11223344',
        birthDate: new Date('1982-03-10'),
        phone: '70567890',
        department: 'Sistemas',
        status: ProfessorStatus.ACTIVE
      },
      {
        email: 'lgarcia@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Luis',
        lastName: 'García',
        role: 'PROFESSOR',
        professorCode: 'PROF004',
        nationalId: '55667788',
        birthDate: new Date('1978-11-28'),
        phone: '70345678',
        department: 'Medicina',
        status: ProfessorStatus.ACTIVE
      }
    ];

    const professors = professorRepository.create(professorsData);
    return await professorRepository.save(professors);
  }

  private async seedStudents(careers: Career[]) {
    console.log('👨‍🎓 Creando estudiantes...');
    
    const studentRepository = this.dataSource.getRepository(Student);
    const systemsCareer = careers.find(c => c.codigo_carrera === 'ING001');
    const medicineCareer = careers.find(c => c.codigo_carrera === 'MED001');
    const civilCareer = careers.find(c => c.codigo_carrera === 'ING002');
    const adminCareer = careers.find(c => c.codigo_carrera === 'ADM001');

    const studentsData = [
      {
        email: 'student1@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Pedro',
        lastName: 'Sánchez',
        role: 'STUDENT',
        studentCode: 'EST001',
        nationalId: '98765432',
        birthDate: new Date('2000-01-15'),
        phone: '70111111',
        status: StudentStatus.ACTIVE,
        career: systemsCareer
      },
      {
        email: 'student2@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Ana',
        lastName: 'López',
        role: 'STUDENT',
        studentCode: 'EST002',
        nationalId: '12349876',
        birthDate: new Date('1999-05-20'),
        phone: '70222222',
        status: StudentStatus.ACTIVE,
        career: systemsCareer
      },
      {
        email: 'student3@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Carlos',
        lastName: 'Morales',
        role: 'STUDENT',
        studentCode: 'EST003',
        nationalId: '56781234',
        birthDate: new Date('2001-03-08'),
        phone: '70333333',
        status: StudentStatus.ACTIVE,
        career: systemsCareer
      },
      {
        email: 'student4@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Lucia',
        lastName: 'Fernández',
        role: 'STUDENT',
        studentCode: 'EST004',
        nationalId: '43218765',
        birthDate: new Date('2000-07-12'),
        phone: '70444444',
        status: StudentStatus.ACTIVE,
        career: medicineCareer
      },
      {
        email: 'student5@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Miguel',
        lastName: 'Torres',
        role: 'STUDENT',
        studentCode: 'EST005',
        nationalId: '78901234',
        birthDate: new Date('1999-11-25'),
        phone: '70555555',
        status: StudentStatus.ACTIVE,
        career: civilCareer
      },
      {
        email: 'student6@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Sofia',
        lastName: 'Vargas',
        role: 'STUDENT',
        studentCode: 'EST006',
        nationalId: '65432109',
        birthDate: new Date('2000-09-14'),
        phone: '70666666',
        status: StudentStatus.ACTIVE,
        career: systemsCareer
      },
      {
        email: 'student7@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Diego',
        lastName: 'Herrera',
        role: 'STUDENT',
        studentCode: 'EST007',
        nationalId: '90123456',
        birthDate: new Date('2001-02-03'),
        phone: '70777777',
        status: StudentStatus.ACTIVE,
        career: adminCareer
      },
      {
        email: 'student8@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Valentina',
        lastName: 'Castro',
        role: 'STUDENT',
        studentCode: 'EST008',
        nationalId: '54321098',
        birthDate: new Date('2000-12-30'),
        phone: '70888888',
        status: StudentStatus.ACTIVE,
        career: systemsCareer
      },
      {
        email: 'student9@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Andrés',
        lastName: 'Ruiz',
        role: 'STUDENT',
        studentCode: 'EST009',
        nationalId: '23456789',
        birthDate: new Date('1999-08-18'),
        phone: '70999999',
        status: StudentStatus.ACTIVE,
        career: medicineCareer
      },
      {
        email: 'student10@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Isabella',
        lastName: 'Mendoza',
        role: 'STUDENT',
        studentCode: 'EST010',
        nationalId: '87654320',
        birthDate: new Date('2001-06-07'),
        phone: '70101010',
        status: StudentStatus.ACTIVE,
        career: systemsCareer
      },
      {
        email: 'student11@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Joaquín',
        lastName: 'Silva',
        role: 'STUDENT',
        studentCode: 'EST011',
        nationalId: '34567890',
        birthDate: new Date('2000-04-22'),
        phone: '70111010',
        status: StudentStatus.ACTIVE,
        career: civilCareer
      },
      {
        email: 'student12@uagrm.edu.bo',
        password: await bcrypt.hash('Abc123', 10),
        firstName: 'Camila',
        lastName: 'Jiménez',
        role: 'STUDENT',
        studentCode: 'EST012',
        nationalId: '67890123',
        birthDate: new Date('1999-10-11'),
        phone: '70121212',
        status: StudentStatus.ACTIVE,
        career: adminCareer
      }
    ];

    const students = studentRepository.create(studentsData);
    return await studentRepository.save(students);
  }

  private async seedSubjectGroups(subjects: Subject[], professors: Professor[], periods: Period[], classrooms: Classroom[]) {
    console.log('📚 Creando grupos de materias...');
    
    const subjectGroupRepository = this.dataSource.getRepository(SubjectGroup);
    const activePeriod = periods.find(p => p.estado === 'activo');
    const groups: Partial<SubjectGroup>[] = [];

    if (!activePeriod) return [];

    // Crear grupos para algunas materias principales
    const introProg = subjects.find(s => s.codigo_materia === 'SIS101');
    const matematicas = subjects.find(s => s.codigo_materia === 'SIS102');
    const poo = subjects.find(s => s.codigo_materia === 'SIS201');
    const anatomia = subjects.find(s => s.codigo_materia === 'MED101');
    const fisica = subjects.find(s => s.codigo_materia === 'GEN101');

    if (introProg) {
      groups.push({
        id_materia: introProg.id_materia,
        numero_grupo: '01',
        cupo_maximo: 30,
        cupo_actual: 15,
        docente: 'Juan Pérez',
        estado: 'abierto',
        materia: introProg,
        profesor: professors[0],
        periodo: activePeriod,
        aula: classrooms[2] // Laboratorio de Sistemas
      });
    }

    if (matematicas) {
      groups.push({
        id_materia: matematicas.id_materia,
        numero_grupo: '01',
        cupo_maximo: 40,
        cupo_actual: 25,
        docente: 'María Martínez',
        estado: 'abierto',
        materia: matematicas,
        profesor: professors[1],
        periodo: activePeriod,
        aula: classrooms[0] // Aula Magna
      });
    }

    if (poo) {
      groups.push({
        id_materia: poo.id_materia,
        numero_grupo: '01',
        cupo_maximo: 25,
        cupo_actual: 18,
        docente: 'Ana Rodríguez',
        estado: 'abierto',
        materia: poo,
        profesor: professors[2],
        periodo: activePeriod,
        aula: classrooms[2] // Laboratorio de Sistemas
      });
    }

    if (anatomia) {
      groups.push({
        id_materia: anatomia.id_materia,
        numero_grupo: '01',
        cupo_maximo: 35,
        cupo_actual: 20,
        docente: 'Luis García',
        estado: 'abierto',
        materia: anatomia,
        profesor: professors[3],
        periodo: activePeriod,
        aula: classrooms[1] // Aula 201
      });
    }

    if (fisica) {
      groups.push({
        id_materia: fisica.id_materia,
        numero_grupo: '01',
        cupo_maximo: 30,
        cupo_actual: 22,
        docente: 'María Martínez',
        estado: 'abierto',
        materia: fisica,
        profesor: professors[1],
        periodo: activePeriod,
        aula: classrooms[3] // Laboratorio de Física
      });
    }

    const createdGroups = subjectGroupRepository.create(groups);
    return await subjectGroupRepository.save(createdGroups);
  }

  private async seedSchedules(subjectGroups: SubjectGroup[], classrooms: Classroom[]) {
    console.log('⏰ Creando horarios...');
    
    const scheduleRepository = this.dataSource.getRepository(Schedule);
    const schedules: Partial<Schedule>[] = [];

    subjectGroups.forEach((group, index) => {
      // Crear 2 horarios por grupo
      const days = ['lunes', 'miercoles', 'viernes'];
      const startTimes = ['08:00', '10:00', '14:00'];
      
      schedules.push({
        id_grupo_materia: group.id_grupo_materia,
        id_aula: group.aula.id_aula,
        dia_semana: days[index % 3] as any,
        hora_inicio: startTimes[index % 3],
        hora_fin: `${parseInt(startTimes[index % 3]) + 2}:00`,
        tipo_clase: 'teorica' as any,
        grupoMateria: group,
        aula: group.aula
      });

      if (group.materia.horas_laboratorio > 0) {
        schedules.push({
          id_grupo_materia: group.id_grupo_materia,
          id_aula: group.aula.id_aula,
          dia_semana: days[(index + 1) % 3] as any,
          hora_inicio: startTimes[(index + 1) % 3],
          hora_fin: `${parseInt(startTimes[(index + 1) % 3]) + 2}:00`,
          tipo_clase: 'laboratorio' as any,
          grupoMateria: group,
          aula: group.aula
        });
      }
    });

    const createdSchedules = scheduleRepository.create(schedules);
    return await scheduleRepository.save(createdSchedules);
  }

  private async seedEnrollments(students: Student[], periods: Period[]) {
    console.log('📝 Creando inscripciones...');
    
    const enrollmentRepository = this.dataSource.getRepository(Enrollment);
    const activePeriod = periods.find(p => p.estado === 'activo');
    const enrollments: Partial<Enrollment>[] = [];

    if (!activePeriod) return [];

    // Crear inscripciones para algunos estudiantes
    const selectedStudents = students.slice(0, 8); // Primeros 8 estudiantes

    selectedStudents.forEach(student => {
      enrollments.push({
        fecha_inscripcion: new Date('2025-01-20'),
        tipo_inscripcion: 'regular' as any,
        estado: 'activa' as any,
        estudiante: student,
        periodo: activePeriod
      });
    });

    const createdEnrollments = enrollmentRepository.create(enrollments);
    return await enrollmentRepository.save(createdEnrollments);
  }

  private async seedEnrollmentDetails(enrollments: Enrollment[], subjectGroups: SubjectGroup[]) {
    console.log('📋 Creando detalles de inscripción...');
    
    const enrollmentDetailRepository = this.dataSource.getRepository(EnrollmentDetail);
    const details: Partial<EnrollmentDetail>[] = [];

    enrollments.forEach((enrollment, enrollmentIndex) => {
      // Cada estudiante se inscribe en 2-3 materias
      const groupsToEnroll = subjectGroups.slice(0, 3);
      
      groupsToEnroll.forEach((group, groupIndex) => {
        if (enrollmentIndex % 2 === 0 || groupIndex < 2) { // Algunos estudiantes en más materias
          details.push({
            id_inscripcion: enrollment.id_inscripcion,
            id_grupo_materia: group.id_grupo_materia,
            fecha_inscripcion_materia: new Date('2025-01-21'),
            estado_materia: 'inscrito' as any,
            inscripcion: enrollment,
            grupoMateria: group
          });
        }
      });
    });

    const createdDetails = enrollmentDetailRepository.create(details);
    return await enrollmentDetailRepository.save(createdDetails);
  }

  private async seedGrades(enrollmentDetails: EnrollmentDetail[]) {
    console.log('📊 Creando notas...');
    
    const gradeRepository = this.dataSource.getRepository(Grade);
    const grades: Partial<Grade>[] = [];

    // Crear notas para algunos detalles de inscripción (simulando progreso del semestre)
    const detailsWithGrades = enrollmentDetails.slice(0, Math.floor(enrollmentDetails.length * 0.6));

    detailsWithGrades.forEach(detail => {
      const primerParcial = Math.floor(Math.random() * 30) + 50; // 50-80
      const segundoParcial = Math.floor(Math.random() * 30) + 50; // 50-80
      const trabajosPracticos = Math.floor(Math.random() * 20) + 70; // 70-90
      const examenFinal = Math.floor(Math.random() * 25) + 60; // 60-85
      const notaFinal = Math.round((primerParcial * 0.25 + segundoParcial * 0.25 + trabajosPracticos * 0.25 + examenFinal * 0.25));

      grades.push({
        primer_parcial: primerParcial,
        segundo_parcial: segundoParcial,
        examen_final: examenFinal,
        trabajos_practicos: trabajosPracticos,
        nota_final: notaFinal,
        observaciones: notaFinal >= 70 ? 'Aprobado' : 'Reprobado',
        fecha_registro: new Date(),
        detalle: detail
      });
    });

    const createdGrades = gradeRepository.create(grades);
    return await gradeRepository.save(createdGrades);
  }
}

// Función principal para ejecutar el seeder
async function runSeeder() {
  try {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);
    
    const seeder = new DatabaseSeeder(dataSource);
    await seeder.seed();
    
    await app.close();
    console.log('🎉 Proceso de seeding completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

runSeeder();