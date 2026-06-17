import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';
import { DestinatarioPersona } from 'src/destinatario_persona/entities/destinatario_persona.entity';
import { DestinatarioGrupo } from 'src/destinatario_grupo/entities/destinatario_grupo.entity';

@Entity('mensajes')
export class Mensaje {
    @PrimaryGeneratedColumn()
    id?: number;

    // ✅ CORRECCIÓN 1: El paréntesis ya está abierto correctamente
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

    // ✅ CORRECCIÓN 2: Le quité la "ñ" al final
    @Column({ nullable: true, type: 'text' })
    ubicacion?: string;
}