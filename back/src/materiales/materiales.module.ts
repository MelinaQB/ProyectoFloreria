import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { MaterialesService } from './materiales.service';
import { MaterialesController } from './materiales.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, Usuario]), 
    AuditoriaModule 
  ],
  controllers: [MaterialesController],
  providers: [MaterialesService],
  exports: [MaterialesService]
})
export class MaterialesModule {}