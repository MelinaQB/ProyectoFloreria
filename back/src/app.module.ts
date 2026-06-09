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
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234567', // Tu contraseña de pgAdmin
      database: 'hanami_db',   // Tu base de datos de Hanami
      autoLoadEntities: true,  // 🔒 SOLUCIÓN: Esto mapea automáticamente a 'Material' y las que vengan
      synchronize: true,       // Obliga a PostgreSQL a crear las tablas faltantes al iniciar
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