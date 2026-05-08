# 🌱 Seeders - Generador de Datos de Prueba

Este módulo contiene seeders para generar datos de prueba realistas para el proyecto de transporte público.

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Estructura](#estructura)
- [Uso](#uso)
- [Seeders Disponibles](#seeders-disponibles)
- [Consideraciones de Ejecución](#consideraciones-de-ejecución)
- [Troubleshooting](#troubleshooting)

## 📝 Descripción

Los seeders generan datos ficticios pero realistas para:
- **Ubicaciones**: Nodos, Paraderos, Rutas, Direcciones
- **Usuarios**: Ciudadanos, Personas
- **Transacciones**: Métodos de pago, Integración ePayco
- **Comunicaciones**: Mensajes, Destinatarios
- **Analytics**: Grupos de personas, Historial de eventos

### Características

✅ **Datos Realistas**: Usa la librería Faker para generar datos coherentes
✅ **Relaciones Automáticas**: Crea automáticamente las relaciones entre entidades
✅ **Ejecución Ordenada**: Respeta las dependencias entre tablas
✅ **Idempotente**: No duplica datos si se ejecuta múltiples veces
✅ **Desarrollo Seguro**: Incluye métodos para limpiar datos (solo en dev)
✅ **Sin Dependencias Pesadas**: No requiere librerías externas como `faker.js`

## 🗂️ Estructura

```
src/seeders/
├── factories/           # Generadores de datos (Factory Pattern)
│   ├── faker.factory.ts           # Utilidades de generación de datos
│   ├── direccion.factory.ts       # Factory de Direcciones
│   ├── ciudadano.factory.ts       # Factory de Ciudadanos
│   ├── nodo.factory.ts            # Factory de Nodos
│   ├── paradero.factory.ts        # Factory de Paraderos
│   ├── ruta.factory.ts            # Factory de Rutas
│   ├── historial.factory.ts       # Factory de Historiales
│   ├── persona.factory.ts         # Factory de Personas
│   ├── grupo.factory.ts           # Factory de Grupos
│   └── mensaje.factory.ts         # Factory de Mensajes
├── seeds/               # Seeders individuales
│   ├── 01-direccion.seeder.ts
│   ├── 02-ciudadano.seeder.ts
│   ├── 03-nodo.seeder.ts
│   ├── 04-paradero.seeder.ts
│   ├── 05-ruta.seeder.ts
│   ├── 06-historial.seeder.ts
│   ├── 07-persona.seeder.ts
│   ├── 08-grupo.seeder.ts
│   ├── 09-grupo-persona.seeder.ts
│   ├── 10-mensaje.seeder.ts
│   ├── 11-destinatario.seeder.ts
│   └── 12-epayco.seeder.ts
├── seeder.service.ts    # Servicio coordinador (inyectable)
├── seeder.module.ts     # Módulo NestJS
├── seed.runner.ts       # CLI para ejecutar seeders
└── README.md            # Este archivo
```

## 🚀 Uso

### 1. **Ejecutar todos los seeders**

```bash
npm run seed
```

Esto:
- Conecta a la base de datos
- Ejecuta todos los seeders en orden
- Crea automáticamente ~1,000+ registros realistas
- Muestra progreso en tiempo real

### 2. **Limpiar todos los datos** (solo desarrollo)

```bash
npm run seed:clear
```

⚠️ **Advertencia**: Borra todos los datos de la base de datos. Solo funciona si `NODE_ENV !== 'production'`.

### 3. **Reseed** (limpiar + sembrar)

```bash
npm run seed:reseed
```

Equivalente a ejecutar `seed:clear` seguido de `seed`.

### 4. **Usar en la aplicación (inyectable)**

```typescript
import { SeederService } from 'src/seeders/seeder.service';

@Controller('admin')
export class AdminController {
  constructor(private seederService: SeederService) {}

  @Post('seed')
  async seed() {
    await this.seederService.seed();
    return { message: 'Seeders completados' };
  }

  @Post('seed/clear')
  async clearData() {
    await this.seederService.clearData();
    return { message: 'Datos borrados' };
  }

  @Post('seed/reseed')
  async reseed() {
    await this.seederService.reseed();
    return { message: 'Reseed completado' };
  }
}
```

## 📊 Seeders Disponibles

| # | Seeder | Registros | Descripción | Dependencias |
|---|--------|-----------|-------------|--------------|
| 01 | Dirección | ~50 | Direcciones de ciudadanos | - |
| 02 | Ciudadano | ~100 | Usuarios del sistema | Dirección |
| 03 | Nodo | ~15 | Nodos/Terminales principales | - |
| 04 | Paradero | ~80 | Paradas de transporte | Nodo |
| 05 | Ruta | ~25 | Rutas de transporte | Nodo |
| 06 | Historial | ~150 | Registro de eventos | Nodo |
| 07 | Persona | ~80 | Personas del sistema | - |
| 08 | Grupo | ~12 | Grupos organizacionales | - |
| 09 | Grupo-Persona | ~240 | Membresías en grupos | Grupo, Persona |
| 10 | Mensaje | ~200 | Mensajes del sistema | Persona |
| 11 | Destinatario | ~500+ | Asignaciones de mensajes | Mensaje, Persona, Grupo |
| 12 | ePayco | ~50+ | Métodos de pago integrados | Ciudadano |

**Total estimado de registros**: ~1,500+

## ⚙️ Consideraciones de Ejecución

### Orden de Ejecución

Los seeders se ejecutan en este orden específico para respetar las dependencias:

1. **Direcciones** (sin dependencias)
2. **Ciudadanos** (necesita Direcciones)
3. **Nodos** (sin dependencias)
4. **Paraderos** (necesita Nodos)
5. **Rutas** (necesita Nodos)
6. **Historiales** (necesita Nodos)
7. **Personas** (sin dependencias)
8. **Grupos** (sin dependencias)
9. **Grupo-Personas** (necesita Grupos, Personas)
10. **Mensajes** (necesita Personas)
11. **Destinatarios** (necesita Mensajes, Personas, Grupos)
12. **ePayco** (necesita Ciudadanos, Métodos de Pago)

### Rendimiento

- **Tiempo típico**: 5-15 segundos
- **Operaciones**: ~1,500+ inserciones
- **Conexión**: MySQL/TypeORM
- **Memoria**: ~50-100MB

### Idempotencia

Cada seeder verifica si ya existen datos:

```typescript
const count = await repository.count();
if (count > 0) {
  this.logger.log(`Ya existen ${count} registros. Omitiendo seed...`);
  return;
}
```

Puedes ejecutar `npm run seed` múltiples veces sin problemas.

## 🔧 Personalización

### Modificar cantidad de registros

Edit cada seeder y cambia los números:

```typescript
// src/seeders/seeds/01-direccion.seeder.ts
const direcciones = DireccionFactory.createMany(50); // Cambiar 50 a otro número
```

### Crear nuevos seeders

1. Crea el factory en `src/seeders/factories/`
2. Crea el seeder en `src/seeders/seeds/`
3. Agrega la importación a `seed.runner.ts`
4. Ejecuta `npm run seed`

### Modificar datos generados

Edit el `FakerFactory`:

```typescript
// src/seeders/factories/faker.factory.ts
static cities = ['Bogotá', 'Medellín', ...]; // Agregar más ciudades
static routeNames = ['Ruta Centro', ...];   // Agregar más nombres
```

## 🐛 Troubleshooting

### Error: "Connection not established"

```
Error: No hay conexión a la base de datos
Solución: Asegúrate de que:
1. Las variables de entorno (.env) están configuradas
2. La base de datos está en línea
3. Las credenciales son correctas
```

### Error: "Cannot read property 'seed' of undefined"

```
Error: TypeORM no está inicializado
Solución: 
1. Verifica que typeorm.config.ts es correcto
2. Reinicia el servicio
3. Ejecuta: npm install
```

### Error: "Foreign key constraint"

```
Error: Falta una entidad referenciada
Solución:
1. Verifica que el seeder anterior se ejecutó
2. Ejecuta: npm run seed:reseed
3. Revisa las relaciones en las entidades
```

### Error: "Duplicate entry" o "Unique constraint"

```
Error: Datos ya existen en la DB
Solución:
1. Ejecuta: npm run seed:clear
2. Luego: npm run seed
```

### Los datos no aparecen

```
Verificar:
1. La conexión a BD está activa: mysql -u user -p database
2. El seeder terminó sin errores (revisar logs)
3. Los registros están en las tablas: SELECT COUNT(*) FROM tabla;
```

## 📚 Ejemplos de Uso Avanzado

### Seed selectivo en un controlador

```typescript
@Post('admin/seed/direcciones')
async seedDirecciones() {
  const seeder = new DireccionSeeder();
  await seeder.seed(this.dataSource);
  return { message: 'Direcciones sembradas' };
}
```

### Limpiar tabla específica

```typescript
const repository = dataSource.getRepository(Direccion);
await repository.clear(); // Borra todos los registros
```

### Verificar datos

```bash
# Contar registros
mysql> SELECT COUNT(*) FROM direcciones;

# Ver estructura
mysql> DESCRIBE direcciones;

# Ver datos de ejemplo
mysql> SELECT * FROM direcciones LIMIT 5;
```

## 🔐 Seguridad

⚠️ **IMPORTANTE**: 

- Los seeders **solo funcionan en desarrollo** (`NODE_ENV !== 'production'`)
- `npm run seed:clear` y `npm run seed:reseed` **no funcionarán en producción**
- No incluyas datos sensibles en los factories
- Los datos generados son solo para desarrollo/testing

## 📖 Más Información

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)
- [Data Seeding Best Practices](https://en.wikipedia.org/wiki/Database_seeding)

---

**Última actualización**: 2026-05-07
**Versión**: 1.0.0
**Mantenedor**: Equipo de Desarrollo
