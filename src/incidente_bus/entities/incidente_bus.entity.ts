import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Incidente } from 'src/incidente/entities/incidente.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Foto } from 'src/foto/entities/foto.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { Turno } from 'src/turno/entities/turno.entity'; // 👈 Importamos Turno

@Entity('incidentes_buses')
export class IncidenteBus {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    type: 'enum',
    enum: ['mecnico', 'accidente', 'retraso', 'otro'], // Normalizado sin acentos para evitar líos en DB
  })
  tipo?: 'mecnico' | 'accidente' | 'retraso' | 'otro';

  @Column({
    type: 'enum',
    enum: ['bajo', 'medio', 'alto', 'critico'],
  })
  gravedad?: 'bajo' | 'medio' | 'alto' | 'critico';

  @Column({ type: 'text' })
  descripcion?: string;

  // ==== 🗺️ CAMPOS DE GEOLOCALIZACIÓN REAL EN NÚMEROS DECIMALES ====
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud?: number;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamp' })
  timestamp?: Date;

  // ==================== RELACIONES ====================
  @ManyToOne(() => Incidente, (i) => i.busesAfectados, { nullable: true })
  @JoinColumn({ name: 'incidente_id' })
  incidente?: Incidente;

  @ManyToOne(() => Bus, (b) => b.incidentesBus)
  @JoinColumn({ name: 'bus_id' })
  bus?: Bus;

  @ManyToOne(() => Turno) // 👈 Relación directa con el turno en curso
  @JoinColumn({ name: 'turno_id' })
  turno?: Turno;

  @ManyToOne(() => Programacion, (p) => p.incidentesBus, { nullable: true })
  @JoinColumn({ name: 'programacion_id' })
  programacion?: Programacion;

  @OneToMany(() => Foto, (foto) => foto.incidenteBus, { cascade: true })
  fotos?: Foto[];
}