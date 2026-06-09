import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Ramo } from '../../ramos/entities/ramo.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  cantidad: number; // Cantidad de ramos que se lleva el cliente

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalBs: number; // Precio total calculado en Bolivianos

  @CreateDateColumn({ type: 'timestamp' })
  fechaVenta: Date;

  @ManyToOne(() => Ramo, { eager: true })
  ramo: Ramo; // Enlace relacional al ramo comprado

  @ManyToOne(() => Usuario)
  admin: Usuario; // Quién registró el pedido para la bitácora
}