import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm'; // 👈 Cambiamos PrimaryGeneratedColumn por PrimaryColumn
import { Turno } from 'src/turno/entities/turno.entity';

@Entity('conductores')
export class Conductor {
    // 🚀 AJUSTE: Ahora el ID no es autoincremental, sino que recibe el UUID string del Auth
    @PrimaryColumn({ type: 'varchar', length: 45 }) 
    id?: string; // 👈 Cambiado de number a string

    @Column()
    nombre?: string;

    @Column({ unique: true })
    licencia?: string;

    @Column()
    telefono?: string;

    @OneToMany(() => Turno, (turno) => turno.conductor)
    turnos?: Turno[];
}