import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Paradero } from 'src/paradero/entities/paradero.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Historial } from 'src/historial/entities/historial.entity';

@Entity('nodos')
export class Nodo {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitud?: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitud?: number;

    @OneToMany(() => Paradero, (p) => p.nodo)
    paraderos?: Paradero[];

    @OneToMany(() => Ruta, (r) => r.nodo)
    rutas?: Ruta[];

    @OneToMany(() => Historial, (h) => h.nodo)
    historiales?: Historial[];
}
