import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { MetodoPago } from 'src/metodo_pago/entities/metodo_pago.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';

@Entity('metodos_pago_ciudadano')
export class MetodoPagoCiudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: 'instrumento_id' })
    instrumentoId?: string; // El número de tarjeta o ID del medio

    @ManyToOne(() => MetodoPago, (mp) => mp.usuariosMetodos)
    @JoinColumn({ name: 'metodo_pago_id' })
    metodoPago?: MetodoPago;

    @OneToMany(() => Boleto, (boleto) => boleto.metodoPagoCiudadano)
    boletos?: Boleto[];
}