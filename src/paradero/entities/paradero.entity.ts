import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';

@Entity('paraderos')
export class Paradero {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  nombre?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitud?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitud?: number;

  @Column({ nullable: true })
  tipo?: string;

  @Column({ nullable: true })
  codigo?: string;

  @ManyToOne(() => Nodo, (nodo) => nodo.paraderos, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'nodo_id' })
  nodo?: Nodo;

  @OneToMany(() => RutaParadero, (rutaParadero) => rutaParadero.paradero)
  rutaParaderos?: RutaParadero[];
}