import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Gps } from 'src/gps/entities/gps.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

@Entity('buses')
export class Bus {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ unique: true })
    placa?: string;

    @Column()
    modelo?: string;

    @Column({ name: 'capacidad_maxima' })
    capacidadMaxima?: number;

    @ManyToOne(() => Empresa, (empresa) => empresa.buses)
    @JoinColumn({ name: 'empresa_id' })
    empresa?: Empresa;

    @OneToOne(() => Gps, (gps) => gps.bus)
    gps?: Gps;

    @OneToMany(() => Programacion, (programacion) => programacion.bus)
    programaciones?: Programacion[];

    @OneToMany(() => Turno, (turno) => turno.bus)
    turnos?: Turno[];

    @OneToMany(() => IncidenteBus, (incidenteBus) => incidenteBus.bus)
    incidentesBus?: IncidenteBus[];
}