import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Bus } from '../../bus/entities/bus.entity';
import { Ruta } from '../../ruta/entities/ruta.entity';

@Entity('ubicaciones_bus')
export class UbicacionBus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  velocidad: number;

  

  @ManyToOne(() => Bus)
  bus: Bus;

  @ManyToOne(() => Ruta)
  ruta: Ruta;

  @CreateDateColumn()
  timestamp: Date;
}