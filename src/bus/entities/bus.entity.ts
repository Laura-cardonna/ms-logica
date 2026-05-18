import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
  AfterLoad, // 👈 Importamos el hook nativo de TypeORM
} from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Gps } from 'src/gps/entities/gps.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';
import { Turno } from 'src/turno/entities/turno.entity';
import { IncidenteBus } from 'src/incidente_bus/entities/incidente_bus.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn()
  id?: number;

  @Index({ unique: true })
  @Column({ unique: true })
  placa?: string;

  @Column({ nullable: true })
  modelo?: string;

  @Column({ type: 'int', nullable: true })
  anio?: number;

  @Column({ name: 'capacidad_sentados', type: 'int', nullable: true })
  capacidadSentados?: number;

  @Column({ name: 'capacidad_parados', type: 'int', nullable: true })
  capacidadParados?: number;

  @Column({ name: 'capacidad_maxima', type: 'int', nullable: true })
  capacidadMaxima?: number;

  @Column({
    type: 'enum',
    enum: ['operativo', 'mantenimiento', 'fuera_de_servicio'],
    default: 'operativo',
  })
  estado?: 'operativo' | 'mantenimiento' | 'fuera_de_servicio';

  @Column({ name: 'foto_url', nullable: true })
  fotoUrl?: string;

  @Column({ name: 'codigo_qr', type: 'text', nullable: true })
  codigoQr?: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.buses)
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @OneToOne(() => Gps, (gps) => gps.bus)
  gps?: Gps;

  @OneToMany(() => Programacion, (programacion) => programacion.bus)
  programaciones?: Programacion[];

  @OneToMany(() => Turno, (turno) => turno.bus)
  turnos?: Turno[];

  @OneToMany(() => IncidenteBus, (incidenteBus) => incidenteBus.bus)
  incidentesBus?: IncidenteBus[];

  // 🎯 GANCHO AUTOMÁTICO: Formatea la URL en tiempo de ejecución para evitar URLs quemadas en la BD
  @AfterLoad()
  formatearRecursosUrl() {
    const apiBase = process.env.API_URL || 'http://localhost:3000';
    if (this.fotoUrl && !this.fotoUrl.startsWith('http')) {
      this.fotoUrl = `${apiBase}/uploads/${this.fotoUrl}`;
    }
  }
}