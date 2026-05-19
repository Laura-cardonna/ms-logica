import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Nodo } from 'src/nodo/entities/nodo.entity';

@Entity('historiales')
export class Historial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // 👇 Este campo es el más importante para la idempotencia
  @Column({ type: 'varchar', unique: true, nullable: true })
  referenciaExterna: string;

  @CreateDateColumn()
  fecha: Date;

  // 👇 Relación opcional pero recomendada hacia la tarjeta recargada
  @ManyToOne(() => MetodoPagoCiudadano, { nullable: true })
  @JoinColumn({ name: 'tarjeta_id' })
  tarjeta: MetodoPagoCiudadano;
  
  @ManyToOne(() => Nodo, (nodo) => nodo.historiales, { nullable: true })
  @JoinColumn({ name: 'nodo_id' })
  nodo: Nodo;
}