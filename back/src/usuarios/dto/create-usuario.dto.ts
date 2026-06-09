import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  nombre: string;

  @IsEmail({}, { message: 'Por favor, introduce un correo electrónico válido (Ej: usuario@dominio.com).' })
  @IsNotEmpty({ message: 'El correo electrónico es mandatorio.' })
  email: string;

  @IsString({ message: 'El celular debe ser texto.' })
  @IsOptional() // 👈 Mantiene tu lógica de campo opcional con el signo ?
  celular?: string;

  @IsString({ message: 'La contraseña debe ser texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede ir vacía.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres por seguridad.' })
  contrasena: string;

  @IsString({ message: 'El rol debe ser texto.' })
  @IsOptional()
  rol?: string;
}