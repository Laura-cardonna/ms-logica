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

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitud?: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitud?: number;

    @Column({ type: 'text', nullable: true })
    direccionCompleta?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    geocodificadoEn?: Date;

    @OneToMany(() => Ciudadano, (c) => c.direccion)
    ciudadanos?: Ciudadano[];
}
