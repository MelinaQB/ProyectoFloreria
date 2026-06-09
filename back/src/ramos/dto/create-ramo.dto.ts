export class MaterialRecetaDto {
  materialId: number;
  cantidadNecesaria: number;
}

export class CreateRamoDto {
  nombre: string;
  precio: number;
  adminId: number; // Firma de auditoría
  materiales: MaterialRecetaDto[]; // Lista de insumos que consumirá el ramo
}