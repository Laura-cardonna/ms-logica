import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Grupo } from 'src/grupo/entities/grupo.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Entity('grupos_personas')
@Unique(['grupo', 'persona'])
export class GrupoPersona {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Grupo, (g) => g.miembros)
    @JoinColumn({ name: 'grupo_id' })
    grupo?: Grupo;

    @ManyToOne(() => Persona, (p) => p.grupos)
    @JoinColumn({ name: 'persona_id' })
    persona?: Persona;

    @Column({ default: 'miembro' }) 
    rol?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaUnion?: Date;
}