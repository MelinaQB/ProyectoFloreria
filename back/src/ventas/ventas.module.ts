import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './entities/venta.entity';
import { Ramo } from '../ramos/entities/ramo.entity';
import { Material } from '../materiales/entities/material.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, Ramo, Material, Usuario]),
    AuditoriaModule
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}