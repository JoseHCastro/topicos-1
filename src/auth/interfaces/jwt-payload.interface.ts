export interface JwtPayload {
  // Identificación básica
  id: string;
  email: string;
  
  // Información del usuario (evita consulta a BD)
  first_name: string;
  last_name: string;
  user_type: string; // 'Student', 'Teacher', 'Admin'
  
  // Información de autorización
  roles: string[]; // Para futuras expansiones de roles
  
  // Información específica por tipo de usuario
  student_code?: string; // Solo para estudiantes
  teacher_category?: string; // Solo para profesores
  
  // Metadatos de seguridad
  iat: number; // Issued at
  exp: number; // Expiration
  jti: string; // JWT ID para revocación
}
