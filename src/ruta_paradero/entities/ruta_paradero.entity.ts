import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Entity('ruta_paradero')
export class RutaParadero {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => Ruta, (ruta) => ruta.rutaParaderos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruta_id' })
  ruta?: Ruta;

  @ManyToOne(() => Paradero, (paradero) => paradero.rutaParaderos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paradero_id' })
  paradero?: Paradero;

  @Column({ name: 'orden_secuencial' })
  ordenSecuencial?: number;

  @Column({ name: 'distancia_desde_anterior_metros', nullable: true })
  distanciaDesdeAnteriorMetros?: number;

  @Column({ name: 'tiempo_desde_anterior_minutos', nullable: true })
  tiempoDesdeAnteriorMinutos?: number;
}