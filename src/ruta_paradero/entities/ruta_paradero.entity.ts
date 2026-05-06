import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Paradero } from 'src/paradero/entities/paradero.entity';

@Entity('rutas_paraderos')
@Unique(['ruta', 'paradero'])
export class RutaParadero {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: 'orden_secuencial' })
    ordenSecuencial?: number; // Orden en que aparece en la ruta

    @Column({ type: 'time', nullable: true, name: 'hora_llegada_estimada' })
    horaLlegadaEstimada?: string; // Hora estimada de llegada a este paradero

    @ManyToOne(() => Ruta)
    @JoinColumn({ name: 'ruta_id' })
    ruta?: Ruta;

    @ManyToOne(() => Paradero)
    @JoinColumn({ name: 'paradero_id' })
    paradero?: Paradero;
}
