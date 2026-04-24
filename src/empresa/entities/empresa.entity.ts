import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from 'src/bus/entities/bus.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  nombre?: string;

  @Column({ nullable: true })
  nit?: string;

  @OneToMany(() => Bus, (bus) => bus.empresa)
  buses?: Bus[];
}
