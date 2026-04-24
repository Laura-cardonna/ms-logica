import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Bus } from 'src/bus/entities/bus.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';

@Entity('programaciones')
export class Programacion {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'date' })
    fecha?: Date;

    @Column({ name: 'hora_salida', type: 'time' })
    horaSalida?: string;

    @ManyToOne(() => Bus, (bus) => bus.programaciones)
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;

    @OneToMany(() => Boleto, (boleto) => boleto.programacion)
    boletos?: Boleto[];
}