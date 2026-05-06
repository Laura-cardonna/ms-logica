import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Entity('validaciones')
export class Validacion {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'enum', enum: ['abordaje', 'descenso'] })
    tipo?: string; // Tipo de validación: abordaje o descenso

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha?: Date; // Timestamp de la validación

    @Column({ nullable: true })
    motivo?: string; // Razón de rechazo si aplica

    @ManyToOne(() => Boleto)
    @JoinColumn({ name: 'boleto_id' })
    boleto?: Boleto;

    @ManyToOne(() => Paradero)
    @JoinColumn({ name: 'paradero_id' })
    paradero?: Paradero;
}
