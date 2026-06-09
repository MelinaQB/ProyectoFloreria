import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Ramo } from './ramo.entity';
import { Material } from '../../materiales/entities/material.entity';

@Entity('ramo_materiales')
export class RamoMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  cantidadNecesaria: number; // Ej: Usa 15 limpiapipas para este ramo

  @ManyToOne(() => Ramo, (ramo) => ramo.receta, { onDelete: 'CASCADE' })
  ramo: Ramo;

  @ManyToOne(() => Material, { eager: true }) // Carga los detalles del material automáticamente
  material: Material;
}