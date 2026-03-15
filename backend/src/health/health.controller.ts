import { Controller, Get } from '@nestjs/common';
import { SkipAuth } from '../auth/skip-auth.decorator';

@SkipAuth()
@Controller()
export class HealthController {
  @Get('healthz')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
