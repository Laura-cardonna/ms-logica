import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';

@Entity('boletos')
export class Boleto {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'decimal' })
    costo?: number;

    @Column({ name: 'inicio_viaje', type: 'timestamp' })
    inicioViaje?: Date;

    @Column({ name: 'fin_viaje', type: 'timestamp', nullable: true })
    finViaje?: Date;

    @ManyToOne(() => Programacion, (p) => p.boletos)
    @JoinColumn({ name: 'programacion_id' })
    programacion?: Programacion;

    @ManyToOne(() => MetodoPagoCiudadano, (mpc) => mpc.boletos)
    @JoinColumn({ name: 'metodo_pago_ciudadano_id' })
    metodoPagoCiudadano?: MetodoPagoCiudadano;
}