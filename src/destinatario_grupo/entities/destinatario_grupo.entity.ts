import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { Grupo } from 'src/grupo/entities/grupo.entity';

@Entity('destinatarios_grupos')
export class DestinatarioGrupo {
    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Mensaje, (m) => m.destinatariosGrupo)
    @JoinColumn({ name: 'mensaje_id' })
    mensaje?: Mensaje;

    @ManyToOne(() => Grupo, (g) => g.destinatarios)
    @JoinColumn({ name: 'grupo_id' })
    grupo?: Grupo;
}
