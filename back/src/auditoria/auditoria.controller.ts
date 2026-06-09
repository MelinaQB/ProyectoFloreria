import { Controller, Get } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  async obtenerTodosLosLogs() {
    // 🔒 Endpoint real para que el panel de administración lea la bitácora de PostgreSQL
    return await this.auditoriaService.obtenerTodosLosLogs();
  }
}