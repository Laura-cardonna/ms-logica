import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bus } from 'src/bus/entities/bus.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

// Usamos strings para que sea más flexible con la DB
export enum EstadoProgramacion {
  PROGRAMADO = 'programado',
  EN_CURSO = 'en_curso',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export enum TipoRecurrencia {
  NONE = 'none',
  LUNES_VIERNES = 'lunes_viernes',
  FINES_DE_SEMANA = 'fines_de_semana',
  DIARIA = 'diaria',
}

@Entity('programaciones')
export class Programacion {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => Bus, (bus) => bus.programaciones)
  @JoinColumn({ name: 'bus_id' })
  bus?: Bus;

  @ManyToOne(() => Ruta, (ruta) => ruta.programaciones)
  @JoinColumn({ name: 'ruta_id' })
  ruta?: Ruta;

  @Column({ type: 'date' })
  fecha?: Date;

  @Column({ name: 'hora_salida', type: 'time' })
  horaSalida?: string;

  @Column({
    type: 'varchar', // Cambiamos 'enum' por 'varchar' para evitar el error de truncado
    length: 20,
    default: EstadoProgramacion.PROGRAMADO,
  })
  estado?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'tipo_recurrencia',
    default: TipoRecurrencia.NONE,
  })
  tipoRecurrencia?: string;

  @Column({ name: 'margen_tolerancia_minutos', type: 'int', default: 0 })
  margenToleranciaMinutos?: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion?: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion?: Date;

  // Relaciones existentes
  @OneToMany(() => Boleto, (boleto) => boleto.programacion)
  boletos?: Boleto[];

  @OneToMany(() => IncidenteBus, (incidenteBus) => incidenteBus.programacion)
  incidentesBus?: IncidenteBus[];
}