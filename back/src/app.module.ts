import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { MaterialesModule } from './materiales/materiales.module';
import { RamosModule } from './ramos/ramos.module';
import { VentasModule } from './ventas/ventas.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '1234567',
      database: process.env.DB_NAME || 'hanami_db',
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsuariosModule,
    AuditoriaModule,
    MaterialesModule,
    RamosModule,
    VentasModule,
    EstadisticasModule,
  ],
})
export class AppModule {}