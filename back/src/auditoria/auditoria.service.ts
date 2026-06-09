import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogAuditoria } from './entities/auditoria.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(LogAuditoria)
    private readonly auditoriaRepository: Repository<LogAuditoria>,
  ) {}

  // 📝 REGISTRO DE LOGS DIRECTO A POSTGRESQL (BLINDADO CONTRA TS)
  async registrarLog(
    usuarioId: number | null | undefined,
    usuarioEmail: string,
    evento: string,
    descripcion: string,
    ip: string = '127.0.0.1',
    browser: string = 'Unknown'
  ): Promise<LogAuditoria> {
    
    // Construimos el objeto plano mapeando los valores limpios
    const datosLog = {
      usuarioId: usuarioId === null ? undefined : usuarioId,
      usuarioEmail,
      evento,
      descripcion,
      ip,
      browser,
    };

    // Guardamos directamente sin pasar por el constructor .create()
    // Al usar 'as any' obligamos a TypeORM a aceptar el tipado plano y retornar la entidad única
    return await this.auditoriaRepository.save(datosLog as any);
  }

  // 📝 LISTADO HISTÓRICO DE AUDITORÍA PARA LA DEFENSA
  async obtenerTodosLosLogs(): Promise<LogAuditoria[]> {
    return await this.auditoriaRepository.find({
      order: { fechaHora: 'DESC' }
    });
  }
}