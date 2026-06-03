import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { DestinatarioPersona } from 'src/destinatario_persona/entities/destinatario_persona.entity';
import { GrupoPersona } from 'src/grupo_persona/entities/grupo_persona.entity';

@Entity('personas')
export class Persona {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    id?: string; // Aquí va el UUID que ves en tu imagen

    @Column({ nullable: true })
    nombre?: string;

    @Column({ unique: true, nullable: true })
    cedula?: string;

    @Column({ nullable: true })
    telefono?: string;

    @Column({ nullable: true })
    email?: string;

    @OneToMany(() => Mensaje, (m) => m.emisor)
    mensajesEnviados?: Mensaje[];

    @OneToMany(() => DestinatarioPersona, (dp) => dp.persona)
    destinatarios?: DestinatarioPersona[];

    @OneToMany(() => GrupoPersona, (gp) => gp.persona)
    grupos?: GrupoPersona[];
}