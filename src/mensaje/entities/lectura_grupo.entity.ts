import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Mensaje } from './mensaje.entity';
import { Persona } from 'src/persona/entities/persona.entity';

// Lectura por miembro de un mensaje de grupo. El leidoAt binario de Mensaje
// sirve para DM; aquí registramos QUIÉN leyó (uno por par mensaje-persona).
// El @Unique da idempotencia por DB: reemitir marcarMensajeLeido no duplica.
@Entity('lecturas_grupos')
@Unique(['mensaje', 'persona'])
export class LecturaGrupo {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Mensaje, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mensaje_id' })
    mensaje?: Mensaje;

    @ManyToOne(() => Persona, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona?: Persona;

    @Column({ name: 'fecha_leida', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaLeida?: Date;
}
