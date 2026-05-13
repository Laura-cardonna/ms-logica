import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor reutilizable para normalizar respuestas HTTP
 * Envuelve todas las respuestas de éxito en un formato estándar
 */
@Injectable()
export class RespuestaEstandarInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Si ya es una respuesta estructurada, retornarla tal cual
        if (data && data.exito !== undefined) {
          return data;
        }

        // Estructurar respuesta estándar
        return {
          exito: true,
          datos: data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
