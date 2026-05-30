import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Bus } from 'src/bus/entities/bus.entity';

@Entity('gps_devices')
export class Gps {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: 'device_code', unique: true })
  deviceCode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude?: number;

  @Column({ name: 'last_update', type: 'timestamp' })
  lastUpdate?: Date;

  @OneToOne(() => Bus, (bus) => bus.gps)
  @JoinColumn({ name: 'bus_id' })
  bus?: Bus;

  @Column('boolean', { default: false })
  enRuta: boolean;

  @Column('varchar', { length: 20, nullable: true })
  velocidad: string; // km/h como string para evitar problemas de tipo
}
