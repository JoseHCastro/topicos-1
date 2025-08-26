export const seedConfig = {
  // Configuración para datos de prueba
  defaultPassword: 'defaultPassword123',
  
  // Número de registros a generar
  counts: {
    admins: 2,
    professors: 5,
    students: 20,
  },
  
  // Departamentos disponibles
  departments: [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Psychology',
    'Economics',
  ],
  
  // Carreras disponibles
  careers: [
    'Computer Science',
    'Software Engineering',
    'Information Systems',
    'Mathematics',
    'Applied Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Psychology',
    'Economics',
    'Business Administration',
  ],
  
  // Dominios de email para estudiantes
  studentEmailDomains: [
    'student.university.edu',
    'students.edu',
    'university.student.com',
  ],
  
  // Dominios de email para profesores
  professorEmailDomains: [
    'professor.university.edu',
    'faculty.edu',
    'university.professor.com',
  ],
};

// Función para generar códigos únicos
export const generateCode = (prefix: string, index: number): string => {
  return `${prefix}${String(index).padStart(3, '0')}`;
};

// Función para generar emails únicos
export const generateEmail = (firstName: string, lastName: string, domain: string): string => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
};
