import { Entity, Column, ManyToOne, OneToMany, JoinColumn, PrimaryColumn } from 'typeorm';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';

@Entity('ciudadanos')
export class Ciudadano {
    @PrimaryColumn({ type: 'varchar', length: 100, nullable: false })
    id?: string;

    @Column()
    nombre?: string;

    @Column({ nullable: true })
    cedula?: string;

    @Column({ nullable: true })
    telefono?: string;

    @Column()
    email?: string;

    @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
    fechaNacimiento?: Date;

    @ManyToOne(() => Direccion, (d) => d.ciudadanos, { nullable: true })
    @JoinColumn({ name: 'direccion_id' })
    direccion?: Direccion;

    @OneToMany(() => MetodoPagoCiudadano, (mpc) => mpc.ciudadano, { cascade: true })
    metodosPago?: MetodoPagoCiudadano[];
}
