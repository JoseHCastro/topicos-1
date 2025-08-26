# 🌱 Módulo de Seeders

Este módulo proporciona un sistema completo de seeders para poblar la base de datos con datos de prueba, similar al sistema de seeders de Laravel.

## 📁 Estructura

```
src/seed/
├── config/
│   └── seed.config.ts          # Configuración general de seeders
├── interfaces/
│   └── seeder.interface.ts     # Interfaz base para seeders
├── seeders/
│   ├── user.seeder.ts          # Seeder para usuarios base
│   ├── admin.seeder.ts         # Seeder para administradores
│   ├── professor.seeder.ts     # Seeder para profesores
│   └── student.seeder.ts       # Seeder para estudiantes
├── seed.module.ts              # Módulo principal
├── seed.service.ts             # Servicio coordinador
└── index.ts                    # Exportaciones del módulo
```

## 🚀 Comandos Disponibles

### Ejecutar todos los seeders
```bash
npm run seed:run
# o
npm run seed run
```

### Ejecutar un seeder específico
```bash
npm run seed run user
npm run seed run admin
npm run seed run professor
npm run seed run student
```

### Limpiar la base de datos
```bash
npm run seed:clear
# o
npm run seed clear
```

### Limpiar y re-poblar (fresh)
```bash
npm run seed:fresh
# o
npm run seed fresh
```

### Ver ayuda
```bash
npm run seed
```

## 📊 Datos Creados

### Usuarios Base (user.seeder.ts)
- `admin@example.com` - Administrador del sistema
- `professor@example.com` - Profesor de ejemplo
- `student@example.com` - Estudiante de ejemplo

### Administradores (admin.seeder.ts)
- `superadmin@example.com` - Super administrador activo
- `admin2@example.com` - Administrador secundario

### Profesores (professor.seeder.ts)
- `prof.mathematics@example.com` - Profesor de Matemáticas (PROF001)
- `prof.physics@example.com` - Profesora de Física (PROF002)
- `prof.chemistry@example.com` - Profesor de Química inactivo (PROF003)

### Estudiantes (student.seeder.ts)
- `juan.perez@student.com` - Estudiante de Computer Science (STU001)
- `maria.garcia@student.com` - Estudiante de Engineering (STU002)
- `pedro.martinez@student.com` - Estudiante inactivo de Mathematics (STU003)
- `ana.rodriguez@student.com` - Estudiante de Physics (STU004)

## 🔧 Configuración

El archivo `config/seed.config.ts` contiene la configuración general:

- Contraseñas por defecto
- Número de registros a generar
- Departamentos y carreras disponibles
- Dominios de email
- Funciones auxiliares para generar códigos únicos

## 🎯 Características

### ✅ Prevención de Duplicados
Cada seeder verifica si los registros ya existen antes de crearlos.

### 📝 Logging Detallado
Logs informativos con emojis para facilitar el seguimiento:
- 🌱 Inicio de seeding
- ✅ Creación exitosa
- ⚠️ Registro ya existe
- 🗑️ Limpieza de datos
- ❌ Errores

### 🔄 Orden de Ejecución
Los seeders se ejecutan en orden específico:
1. Users (base)
2. Admins
3. Professors
4. Students

### 🧹 Limpieza Ordenada
La limpieza se hace en orden inverso para mantener la integridad referencial.

## 🛠️ Extender el Sistema

### Crear un Nuevo Seeder

1. Crear el archivo del seeder:
```typescript
// src/seed/seeders/nuevo.seeder.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeederInterface } from '../interfaces/seeder.interface';
import { NuevaEntidad } from '../../path/to/entity';

@Injectable()
export class NuevoSeeder implements SeederInterface {
  private readonly logger = new Logger(NuevoSeeder.name);

  constructor(
    @InjectRepository(NuevaEntidad)
    private readonly repository: Repository<NuevaEntidad>,
  ) {}

  async run(): Promise<void> {
    // Implementar lógica de seeding
  }

  async clear(): Promise<void> {
    // Implementar lógica de limpieza
  }
}
```

2. Agregar al módulo:
```typescript
// src/seed/seed.module.ts
import { NuevoSeeder } from './seeders/nuevo.seeder';

@Module({
  // ...
  providers: [
    // ...
    NuevoSeeder,
  ],
})
```

3. Agregar al servicio:
```typescript
// src/seed/seed.service.ts
constructor(
  // ...
  private readonly nuevoSeeder: NuevoSeeder,
) {}

async runAllSeeders(): Promise<void> {
  // ...
  await this.nuevoSeeder.run();
}
```

## 📋 Notas Importantes

- Las contraseñas por defecto están hasheadas con bcrypt
- Los seeders verifican duplicados por email y códigos únicos
- El módulo está integrado en el AppModule para facilitar el uso
- Los seeders son idempotentes (se pueden ejecutar múltiples veces)
- Se usa `repository.clear()` en lugar de `repository.delete({})` para evitar errores de TypeORM

## ✅ Solución de Problemas

### Error: "Empty criteria(s) are not allowed for the delete method"
**Solución**: Cambiamos de `repository.delete({})` a `repository.clear()` en todos los seeders.

El método `clear()` es más seguro para limpiar todas las entidades de una tabla sin necesidad de criterios específicos.

## 🔐 Credenciales de Prueba

Todas las contraseñas por defecto siguen el patrón: `[tipo]123`
- Administradores: `admin123` / `superadmin123`
- Profesores: `professor123`
- Estudiantes: `student123`
