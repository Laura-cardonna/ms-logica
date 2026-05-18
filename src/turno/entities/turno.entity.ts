import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conductor } from 'src/conductor/entities/conductor.entity';
import { Bus } from 'src/bus/entities/bus.entity';

@Entity('turnos')
export class Turno {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'date' })
    fecha?: Date;

    @Column({ name: 'hora_inicio', type: 'timestamp' })
    horaInicio?: Date;

    @Column({ name: 'hora_fin', type: 'timestamp' })
    horaFin?: Date;

    @Column()
    estado?: string;

    @Column({ name: 'estadoBusConfirmado', nullable: true })
    estadoBusConfirmado?: string;

    @Column({ name: 'observaciones', nullable: true })
    observaciones?: string;

    @ManyToOne(() => Conductor, (conductor) => conductor.turnos)
    @JoinColumn({ name: 'conductor_id' })
    conductor?: Conductor;

    @ManyToOne(() => Bus, (bus) => bus.turnos)
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;
}