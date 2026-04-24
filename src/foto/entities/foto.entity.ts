import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

@Entity('fotos')
export class Foto {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    url?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha?: Date;

    @ManyToOne(() => IncidenteBus, (ib) => ib.fotos)
    @JoinColumn({ name: 'incidente_bus_id' })
    incidenteBus?: IncidenteBus;
}