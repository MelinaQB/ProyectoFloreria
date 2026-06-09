import { ValidationPipe } from '@nestjs/common'; // 👈 IMPORTANTE
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔒 ACTIVAMOS EL FILTRO GLOBAL CONTRA INYECCIONES Y DATOS MAL FORMADOS
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Borra propiedades que no estén en el DTO
      forbidNonWhitelisted: false, // Lanza error si mandan campos extraños
      transform: true, // Convierte los tipos automáticamente
    }),
  );

  app.enableCors(); // Mantiene la puerta abierta para que React se conecte
  await app.listen(3000);
}
bootstrap();