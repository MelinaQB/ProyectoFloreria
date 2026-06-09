import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ramo } from './entities/ramo.entity';
import { RamoMaterial } from './entities/ramo-material.entity';
import { Material } from '../materiales/entities/material.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { RamosService } from './ramos.service';
import { RamosController } from './ramos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ramo, RamoMaterial, Material, Usuario]),
    AuditoriaModule
  ],
  controllers: [RamosController],
  providers: [RamosService],
  exports: [RamosService]
})
export class RamosModule {}