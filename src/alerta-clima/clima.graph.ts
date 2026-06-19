import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { AlertaClima } from './entities/alerta-clima.entity';
import { ClimaPronostico } from './alerta-clima.service';

// Grafo de orquestación SIN AI (LangGraph como coordinador de nodos/workflow):
// getPendientes → fetchClima → enviar. La lógica de cada nodo se inyecta desde el
// orquestador (que tiene acceso a los servicios), manteniendo el grafo puro/testeable.

export interface ClimaState {
  pendientes: AlertaClima[];
  pronosticos: Record<string, ClimaPronostico>;
  enviados: number;
}

export interface ClimaNodos {
  getPendientes: () => Promise<AlertaClima[]>;
  fetchClima: (
    pendientes: AlertaClima[],
  ) => Promise<Record<string, ClimaPronostico>>;
  enviar: (
    pendientes: AlertaClima[],
    pronosticos: Record<string, ClimaPronostico>,
  ) => Promise<number>;
}

const ClimaAnnotation = Annotation.Root({
  pendientes: Annotation<AlertaClima[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  pronosticos: Annotation<Record<string, ClimaPronostico>>({
    reducer: (_prev, next) => next,
    default: () => ({}),
  }),
  enviados: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
});

export function construirGrafoClima(nodos: ClimaNodos) {
  return new StateGraph(ClimaAnnotation)
    .addNode('getPendientes', async () => ({
      pendientes: await nodos.getPendientes(),
    }))
    .addNode('fetchClima', async (s) => ({
      pronosticos: await nodos.fetchClima(s.pendientes),
    }))
    .addNode('enviar', async (s) => ({
      enviados: await nodos.enviar(s.pendientes, s.pronosticos),
    }))
    .addEdge(START, 'getPendientes')
    .addEdge('getPendientes', 'fetchClima')
    .addEdge('fetchClima', 'enviar')
    .addEdge('enviar', END)
    .compile();
}
