export interface JwtPayload {
  email: string;
  id: string;
  rol: string; // Mantengo 'rol' para consistencia con el JWT
}
