import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Nodo } from 'src/nodo/entities/nodo.entity';

@Entity('historiales')
export class Historial {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'text' })
    descripcion?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha?: Date;

    @ManyToOne(() => Nodo, (n) => n.historiales)
    @JoinColumn({ name: 'nodo_id' })
    nodo?: Nodo;
}
