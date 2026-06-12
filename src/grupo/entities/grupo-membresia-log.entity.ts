import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Grupo } from './grupo.entity'; // Ajusta la ruta relativa si es necesario
import { Persona } from 'src/persona/entities/persona.entity';

@Entity('grupo_membresia_logs')
export class GrupoMembresiaLog {
    @PrimaryGeneratedColumn()
    id?: number;

    // A qué grupo pertenece el cambio
    @ManyToOne(() => Grupo, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'grupo_id' })
    grupo?: Grupo;

    // El usuario que sufre el cambio (quien entra, sale, es promovido, removido o bloqueado)
    @ManyToOne(() => Persona, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_afectado_id' })
    usuarioAfectado?: Persona;

    // El administrador que realiza la acción. Puede ser NULL si el usuario se unió por sí mismo
    @ManyToOne(() => Persona, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'usuario_accion_id' })
    usuarioAccion?: Persona;

    // Tipo de acción: 'UNIRSE', 'AÑADIR', 'REMOVER', 'PROMOVER', 'BLOQUEAR'
    @Column()
    accion?: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha?: Date;
}