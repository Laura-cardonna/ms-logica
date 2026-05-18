import { Injectable } from '@nestjs/common';

@Injectable()
export class BusScanPageService {
  render(bus: any): string {
    const empresa = (bus.empresa && bus.empresa.nombre) || '—';

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Bus ${bus.placa}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:20px}
      .card{max-width:600px;margin:0 auto;padding:16px;border:1px solid #e5e7eb;border-radius:8px}
      h1{margin:0 0 8px}
      dl{display:grid;grid-template-columns:150px 1fr;gap:8px 16px}
      dd{margin:0}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Bus ${bus.placa}</h1>
      <p>Información rápida del bus escaneado.</p>
      <dl>
        <dt>Placa</dt><dd>${bus.placa}</dd>
        <dt>Modelo</dt><dd>${bus.modelo ?? '—'}</dd>
        <dt>Año</dt><dd>${bus.anio ?? '—'}</dd>
        <dt>Capacidad sentados</dt><dd>${bus.capacidadSentados ?? '—'}</dd>
        <dt>Capacidad parados</dt><dd>${bus.capacidadParados ?? '—'}</dd>
        <dt>Empresa</dt><dd>${empresa}</dd>
        <dt>Estado</dt><dd>${bus.estado}</dd>
      </dl>
      <p style="margin-top:12px;color:#6b7280;font-size:13px">Si necesitas más detalles, abre la app administrativa.</p>
    </div>
  </body>
</html>`;
  }
}
