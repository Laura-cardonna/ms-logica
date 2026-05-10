import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'; // Asegúrate de tener instalado jsonwebtoken

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('No se proporcionó un token válido');
    }

    const token = authorization.split(' ')[1];

    try {
      // 1. Validamos la firma con el secreto que comparte con Spring
      const secret = process.env.JWT_SECRET || 'mySuperSecretKeyThatIsAtLeast32CharactersLongForJWT';
      const decoded: any = jwt.verify(token, secret);

      // 2. IMPORTANTE: NestJS guarda el usuario en la request para que los controladores lo usen
      // Spring suele enviar el ID en el campo 'id' o 'sub'. 
      request.user = {
        id: decoded.id || decoded.sub, 
        email: decoded.email
      };

      // Si no hay ID en el token, lanzamos error antes de llegar al servicio
      if (!request.user.id) {
        throw new UnauthorizedException('El token no contiene el ID del usuario');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}