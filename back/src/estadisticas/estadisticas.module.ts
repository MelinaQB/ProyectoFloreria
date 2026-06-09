import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from '../ventas/entities/venta.entity';
import { EstadisticasController } from './estadisticas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Venta])],
  controllers: [EstadisticasController],
})
export class EstadisticasModule {}