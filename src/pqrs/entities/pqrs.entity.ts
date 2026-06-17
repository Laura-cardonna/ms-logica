import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PqrsType, PqrsCategory } from '../dto/create-pqrs.dto';

export enum PqrsStatus {
  PENDIENTE = 'Pendiente',
  EN_REVISION = 'En revisión',
  EN_PROCESO = 'En proceso',
  RESUELTO = 'Resuelto',
}

@Entity('pqrs')
export class PqrsEntity {
  @PrimaryGeneratedColumn()
  numericId?: number; // ID autoincremental para control interno y generación del consecutivo

  @Column({ unique: true })
  radicado?: string; // Ejemplo: PQRS-2026-000001

  @Column({ type: 'enum', enum: PqrsType })
  type?: PqrsType;

  @Column({ type: 'enum', enum: PqrsCategory })
  category?: PqrsCategory;

  @Column({ type: 'text' })
  description?: string;

  @Column()
  email?: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'enum', enum: PqrsStatus, default: PqrsStatus.PENDIENTE })
  status?: PqrsStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @Column({ type: 'timestamp' })
  dueDate?: Date; // Tiempo prometido de respuesta (lo usará N8N para el supervisor)

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;
}