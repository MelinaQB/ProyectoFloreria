import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { RamoMaterial } from './ramo-material.entity';

@Entity('ramos')
export class Ramo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number; // Precio de venta en Bs.

  @Column({ default: 'Disponible' })
  estado: string; // 'Disponible' o 'Agotado'

  @Column({ default: true })
  activo: boolean; // Soft delete

  @CreateDateColumn({ type: 'timestamp' })
  fechaRegistro: Date;

  @OneToMany(() => RamoMaterial, (ramoMaterial) => ramoMaterial.ramo, { cascade: true })
  receta: RamoMaterial[];
}