import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { DestinatarioPersona } from 'src/destinatario_persona/entities/destinatario_persona.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';

// Buenas prácticas: Definimos un Enum para controlar el alcance sin strings hardcodeados
export enum AlcanceAlerta {
  TODOS = 'TODOS',
  RUTA = 'RUTA',
  ZONA = 'ZONA',
}

@Entity('mensajes')
export class Mensaje {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ length: 500 })
    contenido?: string;

    @Column({ name: 'fecha_envio', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaEnvio?: Date;

    @Column({ type: 'timestamp', nullable: true })
    leidoAt?: Date;

    @ManyToOne(() => Persona, (p) => p.mensajesEnviados)
    @JoinColumn({ name: 'emisor_id' })
    emisor?: Persona;

    @OneToMany(() => DestinatarioPersona, (dp) => dp.mensaje, { cascade: true })
    destinatariosPersona?: DestinatarioPersona[];

    @OneToMany(() => DestinatarioGrupo, (dg) => dg.mensaje, { cascade: true })
    destinatariosGrupo?: DestinatarioGrupo[];

    @ManyToOne(() => Persona, { nullable: true })
    @JoinColumn({ name: 'receptorId' })
    receptor?: Persona;

    @Column({ nullable: true, type: 'text' })
    ubicacion?: string;

    // Soft-delete (HU-3-005): borrado por admin. Columna manual (NO
    // @DeleteDateColumn) porque el historial mapea relaciones a mano vía
    // DestinatarioGrupo; filtramos deletedAt explícito en cada query.
    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt?: Date | null;
}