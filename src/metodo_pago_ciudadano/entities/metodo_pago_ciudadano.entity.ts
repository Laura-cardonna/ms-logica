import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { MetodoPago } from 'src/metodo_pago/entities/metodo_pago.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Ciudadano } from 'src/ciudadano/entities/ciudadano.entity';

export enum TipoInstrumento {
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  RECARGABLE = 'RECARGABLE',
  APP_MOVIL = 'APP_MOVIL',
  EFECTIVO = 'EFECTIVO',
}

@Entity('metodos_pago_ciudadano')
export class MetodoPagoCiudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'enum', enum: TipoInstrumento, default: TipoInstrumento.RECARGABLE })
    tipoInstrumento?: TipoInstrumento;

    @Column({ nullable: true })
    identificadorInstrumento?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    saldo?: number;

    @Column({ name: 'fecha_recarga', type: 'timestamp', nullable: true })
    fechaRecarga?: Date;

    @Column({ type: 'enum', enum: ['activo', 'inactivo'], default: 'activo' })
    estado?: string;

    @ManyToOne(() => MetodoPago, (mp) => mp.usuariosMetodos, { nullable: true })
    @JoinColumn({ name: 'metodo_pago_id' })
    metodoPago?: MetodoPago;

// DENTRO DE metodo_pago_ciudadano.entity.ts

  @ManyToOne(() => Ciudadano, (c) => c.metodosPago, { 
    onDelete: 'RESTRICT' // <--- CAMBIA 'CASCADE' POR 'RESTRICT'
  })
  @JoinColumn({ name: 'ciudadano_id' })
  ciudadano?: Ciudadano;

    @OneToMany(() => Boleto, (boleto) => boleto.metodoPagoCiudadano)
    boletos?: Boleto[];
}