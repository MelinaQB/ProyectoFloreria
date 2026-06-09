import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateVentaDto {
  @IsNumber({}, { message: 'El ID del ramo debe ser un número válido.' })
  @IsNotEmpty({ message: 'El ramoId es obligatorio.' })
  ramoId: number; // 🔒 Cambiado a number estricto

  @IsNumber({}, { message: 'La cantidad debe ser un número entero.' })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  cantidad: number;

  @IsNumber({}, { message: 'El ID del administrador o cliente debe ser un número válido.' })
  @IsNotEmpty({ message: 'El adminId es obligatorio.' })
  adminId: number; // 🔒 Cambiado a number estricto
}