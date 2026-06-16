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
