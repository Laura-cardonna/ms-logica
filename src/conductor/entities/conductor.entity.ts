import { Entity, Column, PrimaryColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Turno } from 'src/turno/entities/turno.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Entity('conductores')
export class Conductor {
    @PrimaryColumn({ type: 'varchar', length: 100 }) 
    id?: string; // UUID directo

    @Column({ nullable: true })
    nombre?: string;

    @Column({ unique: true, nullable: true })
    licencia?: string;

    @Column({ nullable: true })
    telefono?: string;

    @OneToOne(() => Persona)
    @JoinColumn({ name: 'id', referencedColumnName: 'id' })
    persona?: Persona;

    @OneToMany(() => Turno, (turno) => turno.conductor)
    turnos?: Turno[];
}