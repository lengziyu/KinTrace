import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      name: 'KinTrace Server',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
