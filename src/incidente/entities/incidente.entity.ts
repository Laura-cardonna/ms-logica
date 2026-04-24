import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

@Entity('incidentes')
export class Incidente {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    tipo?: string;

    @Column({ type: 'text' })
    descripcion?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha?: Date;

    @OneToMany(() => IncidenteBus, (ib) => ib.incidente)
    busesAfectados?: IncidenteBus[];
}