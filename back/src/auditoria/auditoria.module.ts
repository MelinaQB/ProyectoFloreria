import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogAuditoria } from './entities/auditoria.entity'; 
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';

@Module({
  imports: [
    // Registramos la entidad de bitácora para que TypeORM cree la tabla en PostgreSQL
    TypeOrmModule.forFeature([LogAuditoria])
  ],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  // 🔒 EXPORTACIÓN CRÍTICA: Permite que UsuariosModule y VentasModule usen "registrarLog"
  exports: [AuditoriaService], 
})
export class AuditoriaModule {}