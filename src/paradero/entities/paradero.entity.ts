import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Nodo } from 'src/nodo/entities/nodo.entity';
import { RutaParadero } from 'src/ruta_paradero/entities/ruta_paradero.entity';

@Entity('paraderos')
export class Paradero {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column({ type: 'text', nullable: true })
    descripcion?: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitud?: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitud?: number;

    @ManyToOne(() => Nodo, (nodo) => nodo.paraderos)
    @JoinColumn({ name: 'nodo_id' })
    nodo?: Nodo;

    @OneToMany(() => RutaParadero, (rutaParadero) => rutaParadero.paradero)
    rutaParaderos?: RutaParadero[];
}
