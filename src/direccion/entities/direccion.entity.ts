import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';

@Entity('direcciones')
export class Direccion {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    calle?: string;

    @Column()
    numero?: string;

    @Column({ nullable: true })
    apartamento?: string;

    @Column()
    ciudad?: string;

    @Column()
    codigoPostal?: string;

    @OneToMany(() => Ciudadano, (c) => c.direccion)
    ciudadanos?: Ciudadano[];
}
