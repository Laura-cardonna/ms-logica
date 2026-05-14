import { 
  Entity, 
  Column, 
  ManyToOne, 
  OneToMany, 
  JoinColumn, 
  PrimaryGeneratedColumn, 
  Index 
} from 'typeorm';
import { Direccion } from 'src/direccion/entities/direccion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
@Entity('ciudadanos')
export class Ciudadano {
    @PrimaryGeneratedColumn() // Este será el ID real para MySQL (el 1, 2, 3...)
    numericId?: number;

    @Column({ type: 'varchar', length: 100, unique: true }) // Este es tu UUID del token
    id?: string; 

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

    @ManyToOne(() => Direccion, (d) => d.ciudadanos, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'direccion_id' })
    direccion?: Direccion;

    @OneToMany(() => MetodoPagoCiudadano, (mpc) => mpc.ciudadano)
    metodosPago?: MetodoPagoCiudadano[];
}