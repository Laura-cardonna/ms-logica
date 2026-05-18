import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // NestJS inyecta aquí el payload del JWT tras pasar por el JwtAuthGuard

    // Si pediste una propiedad específica (ej: @GetUser('id')), devuelve solo eso
    return data ? user?.[data] : user;
  },
);