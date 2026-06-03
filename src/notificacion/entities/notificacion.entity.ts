import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Persona } from 'src/persona/entities/persona.entity';

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  titulo?: string;

  @Column('text')
  mensaje?: string;

  @Column({ default: false })
  leida?: boolean;

  @CreateDateColumn()
  fechaCreacion?: Date;

  @ManyToOne(() => Persona, { onDelete: 'CASCADE' })
  persona?: Persona;
}