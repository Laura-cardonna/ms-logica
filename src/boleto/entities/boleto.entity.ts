import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';
import { Validacion } from 'src/validacion/entities/validacion.entity';
import { OneToMany } from 'typeorm';



@Entity('boletos')
@Unique(['numeroBoleto'])
export class Boleto {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: 'numero_boleto' })
    numeroBoleto?: string;

    @Column({ type: 'decimal' })
    costo?: number;

    @Column({ name: 'inicio_viaje', type: 'timestamp' })
    inicioViaje?: Date;

    @Column({ name: 'fin_viaje', type: 'timestamp', nullable: true })
    finViaje?: Date;

    @Column({ type: 'enum', enum: ['activo', 'completado', 'cancelado'], default: 'activo' })
    estado?: string; // Estado del boleto para tracking

    @ManyToOne(() => Programacion, (p) => p.boletos)
    @JoinColumn({ name: 'programacion_id' })
    programacion?: Programacion;

    @ManyToOne(() => MetodoPagoCiudadano, (mpc) => mpc.boletos)
    @JoinColumn({ name: 'metodo_pago_ciudadano_id' })
    metodoPagoCiudadano?: MetodoPagoCiudadano;

    @ManyToOne(() => Ruta, (ruta) => ruta.boletos)
    @JoinColumn({ name: 'ruta_id' })
    ruta?: Ruta;

    @ManyToOne(() => Ciudadano)
    @JoinColumn({ name: 'ciudadano_id' })
    ciudadano?: Ciudadano;

    @OneToMany(() => Validacion, (validacion) => validacion.boleto)
    validaciones?: Validacion[];
}