import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';

@Entity('grupos')
export class Grupo {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column({ type: 'text', nullable: true })
    descripcion?: string;

    @Column({ default: true }) 
    esPublico?: boolean;

    @Column({ nullable: true })
    imagenUrl?: string;

    @Column({ name: 'fecha_creacion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion?: Date;

    @OneToMany(() => DestinatarioGrupo, (dg) => dg.grupo)
    destinatarios?: DestinatarioGrupo[];

    @OneToMany(() => GrupoPersona, (gp) => gp.grupo, { cascade: true })
    miembros?: GrupoPersona[];
}