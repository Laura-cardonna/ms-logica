import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { DestinatarioPersona } from 'src/mensaje/entities/destinatario_persona.entity';
import { GrupoPersona } from './grupo_persona.entity';

@Entity('personas')
export class Persona {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: string;

    @Column({ unique: true })
    cedula?: string;

    @Column()
    telefono?: string;

    @Column()
    email?: string;

    @OneToMany(() => Mensaje, (m) => m.emisor)
    mensajesEnviados?: Mensaje[];

    @OneToMany(() => DestinatarioPersona, (dp) => dp.persona)
    destinatarios?: DestinatarioPersona[];

    @OneToMany(() => GrupoPersona, (gp) => gp.persona)
    grupos?: GrupoPersona[];
}
