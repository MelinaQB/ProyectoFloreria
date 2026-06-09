import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module'; // Sube un nivel correctamente

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    AuditoriaModule, // Conexión con el repositorio de logs
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService], // Permite que otros módulos lo utilicen si es necesario
})
export class UsuariosModule {}