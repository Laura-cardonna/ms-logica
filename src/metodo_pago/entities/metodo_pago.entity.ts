import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MetodoPagoCiudadano } from 'src/metodo_pago_ciudadano/entities/metodo_pago_ciudadano.entity';

@Entity('metodos_pago')
export class MetodoPago {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string; // Ejemplo: Tarjeta Crédito, Efectivo, App

    @Column()
    descripcion?: string;

    @OneToMany(() => MetodoPagoCiudadano, (mpc) => mpc.metodoPago)
    usuariosMetodos?: MetodoPagoCiudadano[];
}