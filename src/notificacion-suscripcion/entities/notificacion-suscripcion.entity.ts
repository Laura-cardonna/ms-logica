import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

// HU-ENTR-3-003: suscripción de un ciudadano a una ruta+paradero para recibir
// el aviso "bus próximo" cuando la ETA cae por debajo de su anticipación elegida.
@Entity('notificacion_suscripciones')
export class NotificacionSuscripcion {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => Persona, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'persona_id' })
  persona?: Persona;

  @ManyToOne(() => Ruta, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruta_id' })
  ruta?: Ruta;

  @ManyToOne(() => Paradero, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paradero_id' })
  paradero?: Paradero;

  @Column({ name: 'minutos_anticipacion', type: 'int' })
  minutosAnticipacion?: number; // 5 | 10 | 15

  @Column({
    type: 'enum',
    enum: ['activa', 'inactiva'],
    default: 'activa',
  })
  estado?: 'activa' | 'inactiva';

  // Anti-spam: marca de la última vez que se notificó este acercamiento.
  // Se resetea a null cuando el bus se aleja (ETA vuelve por encima del umbral).
  @Column({ name: 'notificada_en', type: 'datetime', nullable: true })
  notificadaEn?: Date | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion?: Date;
}
