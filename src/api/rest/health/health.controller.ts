import { Controller, Get } from '@nestjs/common';

/**
 * Endpoint publico de disponibilidade. Alvo do ping de keep-alive
 * (.github/workflows/keep-alive.yml) que evita o cold start do free tier
 * do Render — ver ADR-0006. Tambem serve para monitoramento externo
 * (UptimeRobot etc.). Nao toca no banco de proposito: mede se o processo
 * esta de pe, e o ping nao mantem o Neon acordado a toa.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
