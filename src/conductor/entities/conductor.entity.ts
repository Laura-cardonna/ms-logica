import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Turno } from 'src/turno/entities/turno.entity';

@Entity('conductores')
export class Conductor {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column({ unique: true })
    licencia?: string;

    @Column()
    telefono?: string;

    @OneToMany(() => Turno, (turno) => turno.conductor)
    turnos?: Turno[];
}