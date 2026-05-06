import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { MetodoPago } from 'src/metodo_pago/entities/metodo_pago.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';

@Entity('metodos_pago_ciudadano')
export class MetodoPagoCiudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: 'instrumento_id' })
    instrumentoId?: string; // El número de tarjeta o ID del medio

    @Column({ type: 'decimal', default: 0 })
    saldo?: number;

    @Column({ name: 'fecha_recarga', type: 'timestamp', nullable: true })
    fechaRecarga?: Date;

    @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
    estado?: string;

    @ManyToOne(() => MetodoPago, (mp) => mp.usuariosMetodos)
    @JoinColumn({ name: 'metodo_pago_id' })
    metodoPago?: MetodoPago;

    @ManyToOne(() => Ciudadano, (c) => c.metodosPago)
    @JoinColumn({ name: 'ciudadano_id' })
    ciudadano?: Ciudadano;

    @OneToMany(() => Boleto, (boleto) => boleto.metodoPagoCiudadano)
    boletos?: Boleto[];
}