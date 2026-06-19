import { DataSource } from 'typeorm';
import { Historial } from '../historial/entities/historial.entity';
import { Nodo } from '../nodo/entities/nodo.entity';

export async function seedHistoriales(dataSource: DataSource) {
  const historialRepository = dataSource.getRepository(Historial);
  const nodoRepository = dataSource.getRepository(Nodo);

  // Obtener nodos existentes
  const nodos = await nodoRepository.find();

  if (nodos.length === 0) {
    console.log('⚠ No se pueden crear historiales sin nodos previos');
    return;
  }

  const historiales = [
    {
      descripcion: 'Mantenimiento preventivo realizado exitosamente',
      nodo: nodos[0],
    },
    {
      descripcion: 'Actualización de sistema de GPS completada',
      nodo: nodos[1],
    },
    {
      descripcion: 'Recalibración de sensores realizada',
      nodo: nodos[0],
    },
    {
      descripcion: 'Instalación de nueva señalética',
      nodo: nodos[2],
    },
    {
      descripcion: 'Revisión de infraestructura de terminales',
      nodo: nodos[3],
    },
    {
      descripcion: 'Reparación de validador de tarjetas de recaudo',
      nodo: nodos[0],
    },
    {
      descripcion: 'Sustitución de luminarias LED en plataforma de abordaje',
      nodo: nodos[1] ?? nodos[0],
    },
    {
      descripcion: 'Mantenimiento correctivo del sistema de cámaras de seguridad CCTV',
      nodo: nodos[2] ?? nodos[0],
    },
    {
      descripcion: 'Pintura general y demarcación de zonas de espera',
      nodo: nodos[3] ?? nodos[0],
    },
    {
      descripcion: 'Instalación de nueva pantalla digital de información al usuario',
      nodo: nodos[4] ?? nodos[0],
    },
    {
      descripcion: 'Calibración y lubricación de torniquetes de acceso',
      nodo: nodos[1] ?? nodos[0],
    },
    {
      descripcion: 'Jornada de limpieza profunda y desinfección de la estación',
      nodo: nodos[2] ?? nodos[0],
    },
    {
      descripcion: 'Revisión de cableado estructurado y reparación de red Wi-Fi pública',
      nodo: nodos[5] ?? nodos[0],
    },
    {
      descripcion: 'Auditoría de infraestructura para accesibilidad de personas con movilidad reducida',
      nodo: nodos[0],
    },
    {
      descripcion: 'Reparación de cubiertas por reporte de filtración de aguas lluvias',
      nodo: nodos[3] ?? nodos[0],
    },
  ];

  // ✅ Versión corregida y segura contra duplicados:
  for (const historial of historiales) {
    const existing = await historialRepository.findOne({
      where: { 
        descripcion: historial.descripcion,
        nodo: { id: historial.nodo.id }
      },
    });

    if (!existing) {
      await historialRepository.save(historial);
    }
  }

  console.log('✓ Historiales seeded (sin duplicados)');}
