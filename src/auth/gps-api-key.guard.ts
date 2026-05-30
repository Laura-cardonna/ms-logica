import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class GpsApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-gps-api-key'];

    if (!apiKey || apiKey !== process.env.GPS_API_KEY) {
      throw new UnauthorizedException('API Key de GPS inválida o ausente');
    }

    return true;
  }
}