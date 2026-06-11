import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested
} from 'class-validator';

export class MaterialRecetaDto {

  @Type(() => Number)
  @IsNumber()
  materialId: number;

  @Type(() => Number)
  @IsNumber()
  cantidadNecesaria: number;
}

export class CreateRamoDto {

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @Type(() => Number)
  @IsNumber()
  precio: number;

  @Type(() => Number)
  @IsNumber()
  adminId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialRecetaDto)
  materiales: MaterialRecetaDto[];
}