import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Mensaje } from './mensaje.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Entity('destinatarios_personas')
export class DestinatarioPersona {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Mensaje, (m) => m.destinatariosPersona)
    @JoinColumn({ name: 'mensaje_id' })
    mensaje?: Mensaje;

    @ManyToOne(() => Persona, (p) => p.destinatarios)
    @JoinColumn({ name: 'persona_id' })
    persona?: Persona;
}
