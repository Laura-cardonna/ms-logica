// 📁 src/incidente/entities/incidente.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

@Entity('incidentes')
export class Incidente {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    tipo?: string;

    @Column({ type: 'text' })
    descripcion?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha?: Date;

    // 🚨 NUEVO: Criterio - Filtrar por estado (pendiente, en_revision, resuelto)
    @Column({ type: 'varchar', length: 30, default: 'pendiente' })
    estado?: 'pendiente' | 'en_revision' | 'resuelto';

// 🚨 Corrección para MySQL: Permitimos nulos y quitamos el default de la BD
    @Column({ type: 'json', nullable: true })
    comentarios?: Array<{ autor: string; texto: string; fecha: Date }> = [];

    @OneToMany(() => IncidenteBus, (ib) => ib.incidente)
    busesAfectados?: IncidenteBus[];
}