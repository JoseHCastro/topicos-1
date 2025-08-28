# 📊 Plan de Expansión: Control Transaccional Global

## 🎯 Endpoints que NECESITAN Control Transaccional

### **PRIORIDAD ALTA (Implementar Ya):**

#### **1. Gestión de Calificaciones (`/assessments/grades`)**
```typescript
// Problemática actual:
POST /grades - Sin control de concurrencia
PUT /grades/:id - Puede sobrescribir cambios simultáneos
```
**Riesgo**: Profesores sobrescribiendo calificaciones mutuamente

#### **2. Creación de Secciones de Curso (`/teaching/course-sections`)**  
```typescript
// Problemática actual:
POST /course-sections - Sin validación de conflictos de horario/aula
```
**Riesgo**: Doble asignación de aulas, choques de horario de profesores

#### **3. Gestión de Horarios (`/teaching/schedules`)**
```typescript
// Problemática actual:
POST /schedules - Sin validación de conflictos de aula
PUT /schedules/:id - Sin control de overlapping
```
**Riesgo**: Conflictos de aulas, horarios superpuestos

---

### **PRIORIDAD MEDIA (Implementar Después):**

#### **4. Gestión de Usuarios (`/auth/users`)**
```typescript
// Problemática actual:
POST /auth/register - Sin validación atómica de unicidad
PUT /auth/users/:id - Sin control de cambios simultáneos
```
**Riesgo**: Usuarios duplicados, inconsistencias de perfil

#### **5. Gestión de Cursos (`/programs/courses`)**
```typescript
// Problemática actual:
POST /courses - Sin validación de códigos duplicados
PUT /courses/:id - Sin control de prerrequisitos circulares
```
**Riesgo**: Códigos duplicados, dependencias circulares

---

### **PRIORIDAD BAJA (Optimización):**

#### **6. Consultas de Catálogo**
- Solo necesitan **caché** y **optimización de consultas**
- No requieren control transaccional estricto

#### **7. Reportes y Analytics**
- Pueden usar **réplicas de lectura**
- No afectan datos críticos

---

## 🏗️ Implementación Progresiva

### **PASO 1: Extender AtomicServices Existentes**

#### **AtomicGradeService**
```typescript
@Injectable()
export class AtomicGradeService {
  async updateGradeAtomically(
    gradeId: string, 
    updateData: UpdateGradeDto,
    userId: string // Para audit trail
  ): Promise<GradeResult> {
    return await this.transactionService.executeWithRetry(async (manager) => {
      // 1. Lock the grade record
      const grade = await manager.findOne(Grade, {
        where: { id: gradeId },
        lock: { mode: 'pessimistic_write' }
      });
      
      // 2. Validate business rules
      await this.validateGradeUpdate(grade, updateData);
      
      // 3. Update atomically with audit
      const result = await this.updateWithAudit(manager, grade, updateData, userId);
      
      return result;
    });
  }
}
```

#### **AtomicScheduleService**
```typescript
@Injectable()
export class AtomicScheduleService {
  async createScheduleAtomically(
    createScheduleDto: CreateScheduleDto
  ): Promise<ScheduleResult> {
    return await this.transactionService.executeWithRetry(async (manager) => {
      // 1. Lock classroom and time slot
      await this.lockClassroomTimeSlot(manager, createScheduleDto);
      
      // 2. Validate no conflicts
      await this.validateNoScheduleConflicts(manager, createScheduleDto);
      
      // 3. Create schedule atomically
      const schedule = await this.createSchedule(manager, createScheduleDto);
      
      return schedule;
    });
  }
}
```

### **PASO 2: Crear Decorador Transaccional**

```typescript
// src/common/decorators/transactional.decorator.ts
export function Transactional(options?: TransactionOptions) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const transactionService = this.transactionService;
      
      return await transactionService.executeWithRetry(
        async (manager) => {
          // Inyectar EntityManager en el contexto
          const originalMethod = method.bind(this);
          return await originalMethod.call(this, manager, ...args);
        },
        options?.maxRetries || 3,
        options?.timeoutMs || 5000
      );
    };
  };
}

// Uso:
@Injectable()
export class SomeService {
  @Transactional({ maxRetries: 5, timeoutMs: 10000 })
  async criticalOperation(manager: EntityManager, data: any) {
    // Lógica automáticamente envuelta en transacción
  }
}
```

### **PASO 3: Middleware Transaccional Global**

```typescript
// src/common/middleware/transaction.middleware.ts
@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  constructor(private transactionService: TransactionService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Solo aplicar a endpoints críticos
    const criticalPaths = [
      '/atomic-enrollment',
      '/grades',
      '/course-sections', 
      '/schedules'
    ];
    
    const isCriticalPath = criticalPaths.some(path => 
      req.path.startsWith(path)
    );
    
    if (isCriticalPath && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Agregar contexto transaccional al request
      req['transactionContext'] = {
        needsTransaction: true,
        timestamp: new Date(),
        requestId: generateRequestId()
      };
    }
    
    next();
  }
}
```

---

## 🎯 Beneficios de la Expansión

### **Antes (Solo Inscripciones)**
```
┌─────────────────┐    ┌─────────────────┐
│   Inscripciones │───▶│   TRANSACCIONAL │ ✅
│   (Atómico)     │    │   (Seguro)      │
└─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│   Calificaciones│───▶│   NO ATÓMICO    │ ❌
│   Horarios      │    │   (Vulnerable)  │
│   Otros...      │    │                 │
└─────────────────┘    └─────────────────┘
```

### **Después (Sistema Completo)**
```
┌─────────────────┐    ┌─────────────────┐
│   TODOS los     │───▶│   TRANSACCIONAL │ ✅
│   Endpoints     │    │   (Seguro)      │
│   Críticos      │    │   (Consistente) │
└─────────────────┘    └─────────────────┘
```

---

## 📋 Plan de Implementación

### **Semana 1:**
- ✅ **COMPLETADO**: AtomicEnrollmentService
- 🎯 **SIGUIENTE**: AtomicGradeService 
- 🎯 **SIGUIENTE**: AtomicScheduleService

### **Semana 2:**
- 🎯 Decorador @Transactional
- 🎯 Middleware transaccional global
- 🎯 Expansion a course-sections

### **Semana 3:**
- 🎯 Testing integral de todos los endpoints
- 🎯 Performance tuning
- 🎯 Documentación actualizada

---

## 🔧 Configuración Recomendada

### **Aplicar Transacciones a:**
```typescript
// Endpoints que MODIFICAN datos críticos
const CRITICAL_ENDPOINTS = [
  'POST /atomic-enrollment/enroll',     // ✅ YA IMPLEMENTADO
  'POST /grades',                       // 🎯 SIGUIENTE
  'PUT /grades/:id',                    // 🎯 SIGUIENTE  
  'POST /course-sections',              // 🎯 SIGUIENTE
  'POST /schedules',                    // 🎯 SIGUIENTE
  'PUT /schedules/:id',                 // 🎯 SIGUIENTE
  'POST /auth/register',                // 🎯 DESPUÉS
  'POST /courses',                      // 🎯 DESPUÉS
];

// Endpoints que NO necesitan transacciones
const READ_ONLY_ENDPOINTS = [
  'GET /courses',                       // Solo lectura
  'GET /schedules',                     // Solo lectura
  'GET /students',                      // Solo lectura
];
```

---

## 🚨 Respuesta a tu Pregunta

**Implementé solo para inscripciones inicialmente porque:**

1. **Enfoque incremental**: Mejor probar en el punto más crítico primero
2. **Riesgo controlado**: Validar la solución antes de expandir
3. **Impacto inmediato**: Resolver el problema más urgente primero

**Pero DEFINITIVAMENTE debe expandirse** a otros endpoints críticos usando la misma infraestructura (`TransactionService`, filtros globales, etc.)

**¿Quieres que implemente alguno de estos otros servicios atómicos ahora, o prefieres continuar con las otras fases (JWT Stateless, etc.)?**