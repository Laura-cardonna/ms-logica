# Database Seeders - Proyecto Buses

Este directorio contiene todos los seeders para poblar la base de datos con datos coherentes y realistas.

## Estructura

```
src/seeds/
├── index.ts                          # Orquestador principal de seeders
├── run-seeds.ts                      # Script ejecutable para correr los seeds
├── empresa.seed.ts                   # Datos: 4 empresas de transporte
├── metodo-pago.seed.ts              # Datos: 5 métodos de pago
├── conductor.seed.ts                # Datos: 6 conductores con licencias
├── bus.seed.ts                      # Datos: 7 buses con placas únicas
├── gps.seed.ts                      # Datos: 7 dispositivos GPS con coordenadas reales
├── programacion.seed.ts             # Datos: 11 programaciones para hoy/mañana
├── turno.seed.ts                    # Datos: 6 turnos (completados, en_curso, programados)
├── incidente.seed.ts                # Datos: 5 incidentes variados
├── incidente-bus.seed.ts            # Datos: 6 relaciones incidente-bus
├── metodo-pago-ciudadano.seed.ts    # Datos: 8 instrumentos de pago
├── boleto.seed.ts                   # Datos: 8 boletos con diferentes estados
└── foto.seed.ts                     # Datos: 8 fotos de incidentes
```

## Cómo usar

### 1. Ejecutar todos los seeders

```bash
npm run seed
```

Esto ejecutará todos los seeders en el orden correcto respetando las dependencias:

1. **Fase 1** (Sin dependencias):
   - Empresas
   - Métodos de Pago
   - Conductores
   - Incidentes

2. **Fase 2** (Dependen de Fase 1):
   - Buses → Empresa
   - Métodos de Pago Ciudadano → Método de Pago

3. **Fase 3** (Dependen de Fase 2):
   - GPS → Bus
   - Programaciones → Bus
   - Turnos → Bus + Conductor
   - Incidentes Bus → Incidente + Bus

4. **Fase 4** (Dependen de Fase 3):
   - Boletos → Programación + Método de Pago Ciudadano
   - Fotos → Incidente Bus

### 2. Datos generados

#### Empresas (4)

- Transportes Rápido
- Buses Andinos
- Transportes del Sur
- Rutas Expeditas

#### Métodos de Pago (5)

- Tarjeta de Débito
- Tarjeta de Crédito
- Transferencia Bancaria
- Efectivo
- Billetera Digital

#### Conductores (6)

- Nombres realistas con teléfono y licencias únicas
- Licencias con formato: `LIC-XXX-2024`

#### Buses (7)

- Placas únicas: `BUS-001` a `BUS-007`
- Modelos realistas: Mercedes-Benz, Scania, Volvo
- Capacidades entre 35-55 pasajeros
- Distribuidos entre las 4 empresas

#### Dispositivos GPS (7)

- Códigos: `GPS-DEV-001` a `GPS-DEV-007`
- Coordenadas reales de Bogotá y zonas aledañas
- Latitud/Longitud con 8 decimales de precisión

#### Programaciones (11)

- Programadas para hoy, mañana y pasado mañana
- Horarios entre 06:00 y 17:00
- Múltiples salidas por día

#### Turnos (6)

- Estados: `completado`, `en_curso`, `programado`
- Horarios realistas (6-8 horas de trabajo)
- Asignados a conductores y buses

#### Incidentes (5)

- Tipos: Accidente, Retraso, Falla mecánica, Incidente con pasajero, Vandalismo
- Fechas en pasado reciente
- Descripciones detalladas coherentes

#### Métodos de Pago Ciudadano (8)

- Instrumentos: Tarjetas de crédito/débito, transferencias, wallets
- IDs realistas pero no sensibles

#### Boletos (8)

- Costos: 2500-3200 COP
- Estados: algunos con finViaje, otros en tránsito
- Distribuidos en programaciones

#### Fotos (8)

- URLs ficticias pero estructuradas
- Asociadas a incidentes
- Fechas coherentes con los incidentes

## Características

✅ **Datos coherentes**: Todos los datos son semánticamente correctos
✅ **Evita duplicados**: Verifica existencia antes de insertar
✅ **Orden de dependencias**: Respeta relaciones entre tablas
✅ **Información realista**: Nombres, datos, patrones reales
✅ **Fechas contextuales**: Usa fechas relativas (hoy, mañana, hace X días)
✅ **Mensajes informativos**: Muestra progreso durante la ejecución

## Notas técnicas

- Los seeders verifican duplicados antes de insertar
- Cada seeder es independiente y reutilizable
- El archivo `index.ts` orquesta la ejecución en orden
- Soporta múltiples ejecuciones sin crear duplicados
- Requiere variables de entorno: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`

## Troubleshooting

### Error: "Database connection refused"

- Verifica que MySQL esté corriendo
- Verifica variables de entorno en `.env`

### Error: "No empresas found"

- Los seeders se ejecutan secuencialmente
- Si uno falla, detén y revisa el error

### Ejecutar solo ciertos seeders

Importa directamente en tu código:

```typescript
import { seedBuses } from 'src/seeds/bus.seed';
await seedBuses(dataSource);
```
