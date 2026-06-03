import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Entity('ciudadanos')
export class Ciudadano {
    @PrimaryGeneratedColumn()
    numericId?: number; // El 1, 2, 3 de tu imagen (mantiene tus pagos a salvo)

    @Column({ type: 'varchar', length: 100, unique: true })
    id?: string; // El UUID de tu imagen

    @Column({ type: 'varchar', length: 255, nullable: true })
    nombre?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    cedula?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefono?: string;

    @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
    fechaNacimiento?: Date;

// Vínculo con Persona usando el UUID
    // LE AGREGAMOS { cascade: true } AQUÍ ABAJO:
    @OneToOne(() => Persona, { cascade: true }) 
    @JoinColumn({ name: 'id', referencedColumnName: 'id' })
    persona?: Persona;

    @ManyToOne(() => Direccion, (d) => d.ciudadanos, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'direccion_id' })
    direccion?: Direccion;

    @OneToMany(() => MetodoPagoCiudadano, (mpc) => mpc.ciudadano)
    metodosPago?: MetodoPagoCiudadano[];
}