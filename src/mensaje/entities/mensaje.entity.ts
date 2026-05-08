import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { DestinatarioPersona } from './destinatario_persona.entity';
import { DestinatarioGrupo } from './destinatario_grupo.entity';

@Entity('mensajes')
export class Mensaje {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    contenido?: string;

    @Column({ name: 'fecha_envio', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fechaEnvio?: Date;

    @ManyToOne(() => Persona, (p) => p.mensajesEnviados)
    @JoinColumn({ name: 'emisor_id' })
    emisor?: Persona;

    @OneToMany(() => DestinatarioPersona, (dp) => dp.mensaje, { cascade: true })
    destinatariosPersona?: DestinatarioPersona[];

    @OneToMany(() => DestinatarioGrupo, (dg) => dg.mensaje, { cascade: true })
    destinatariosGrupo?: DestinatarioGrupo[];
}
