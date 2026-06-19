import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';

// HU-ENTR-3-013: suscripción de un ciudadano a las "Alertas de clima". Cada mañana
// (cron + ventana de 2 h antes de su horario de viaje) se le notifica el pronóstico
// por su canal preferido. Tabla NUEVA a propósito: `synchronize` crea tablas nuevas
// pero NO columnas en tablas existentes, así que no se cuelgan prefs en `personas`.
@Entity('alertas_clima')
export class AlertaClima {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => Persona, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona?: Persona;

  // Snapshot del email al suscribir, para no depender de un join en el envío.
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email?: string;

  // Horario habitual de viaje (ej. "07:00:00"). La columna `time` devuelve HH:MM:SS.
  @Column({ name: 'hora_viaje', type: 'time' })
  horaViaje?: string;

  @Column({ name: 'ciudad', type: 'varchar', length: 120 })
  ciudad?: string;

  @Column({ type: 'enum', enum: ['email', 'telegram'], default: 'email' })
  canal?: 'email' | 'telegram';

  // Credencial que el usuario pega para recibir por Telegram (chat_id destino).
  @Column({ name: 'telegram_chat_id', type: 'varchar', length: 120, nullable: true })
  telegramChatId?: string | null;

  @Column({ type: 'enum', enum: ['activa', 'inactiva'], default: 'activa' })
  estado?: 'activa' | 'inactiva';

  // Anti-duplicado: marca de la última notificación enviada. Se compara contra "hoy"
  // para no avisar dos veces el mismo día aunque el cron corra cada hora.
  @Column({ name: 'ultima_notificacion', type: 'datetime', nullable: true })
  ultimaNotificacion?: Date | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion?: Date;
}
