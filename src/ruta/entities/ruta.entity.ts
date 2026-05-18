import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';

@Entity('rutas')
export class Ruta {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  nombre?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tarifa?: number; // Precio de la tarifa

  @Column({ type: 'enum', enum: ['activa', 'inactiva'], default: 'activa' })
  estado?: string;

  @Column({ name: 'duracion_estimada', nullable: true })
  duracionEstimada?: number; // en minutos

  @ManyToOne(() => Nodo, (nodo) => nodo.rutas)
  @JoinColumn({ name: 'nodo_id' })
  nodo?: Nodo;

  @OneToMany(() => Boleto, (boleto) => boleto.ruta)
  boletos?: Boleto[];

  @OneToMany(() => RutaParadero, (rutaParadero) => rutaParadero.ruta, {
    eager: false,
    cascade: false,
  })
  rutaParaderos?: RutaParadero[];

  @OneToMany(() => Programacion, (programacion) => programacion.ruta)
  programaciones?: Programacion[];
}
