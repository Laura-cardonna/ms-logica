import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Incidente } from 'src/incidente/entities/incidente.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Foto } from 'src/foto/entities/foto.entity';

@Entity('incidentes_buses')
export class IncidenteBus {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Incidente, (i) => i.busesAfectados)
    @JoinColumn({ name: 'incidente_id' })
    incidente?: Incidente;

    @ManyToOne(() => Bus, (b) => b.incidentesBus)
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;

    @OneToMany(() => Foto, (foto) => foto.incidenteBus)
    fotos?: Foto[];
}