import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('materiales')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  detalle: string; 

  @Column({ type: 'int', default: 0 })
  stock: number; // 📦 Aquí guardamos los Paquetes (ej: 13, 2, 12, 10, 20)

  @Column({ type: 'int', default: 100 })
  unidadesPorPaquete: number; // 🔍 Tu nueva columna: 100 unidades, 2 pliegos, 50 unidades, etc.

  @Column({ default: true })
  activo: boolean; 

  @Column({ type: 'int', default: 0 })
  unidadesSueltas: number;

  @CreateDateColumn({ type: 'timestamp' })
  fechaRegistro: Date;

  
}