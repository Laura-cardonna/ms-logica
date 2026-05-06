import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';

@Entity('ciudadanos')
export class Ciudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column({ unique: true })
    cedula?: string;

    @Column()
    telefono?: string;

    @Column()
    email?: string;

    @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
    fechaNacimiento?: Date;

    @ManyToOne(() => Direccion, (d) => d.ciudadanos)
    @JoinColumn({ name: 'direccion_id' })
    direccion?: Direccion;

    @OneToMany(() => MetodoPagoCiudadano, (mpc) => mpc.ciudadano)
    metodosPago?: MetodoPagoCiudadano[];
}
