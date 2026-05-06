import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Bus } from 'src/bus/entities/bus.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';

@Entity('programaciones')
export class Programacion {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'date' })
    fecha?: Date;

    @Column({ name: 'hora_salida', type: 'time' })
    horaSalida?: string;

    @Column({ name: 'hora_llegada', type: 'time', nullable: true })
    horaLlegada?: string;

    @Column({ name: 'duracion_estimada', nullable: true })
    duracionEstimada?: number; // en minutos

    @Column({ type: 'enum', enum: ['programada', 'activa', 'completada', 'cancelada'], default: 'programada' })
    estado?: string; // Estado para identificar si está activa

    @ManyToOne(() => Bus, (bus) => bus.programaciones)
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;

    @ManyToOne(() => Ruta)
    @JoinColumn({ name: 'ruta_id' })
    ruta?: Ruta;

    @OneToMany(() => Boleto, (boleto) => boleto.programacion)
    boletos?: Boleto[];
}