import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auditoria')
export class LogAuditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  usuarioId: number;

  @Column()
  usuarioEmail: string;

  @Column()
  evento: string; // 'INGRESO', 'SALIDA', 'TRANSACCION_VENTA', etc.

  @Column()
  descripcion: string;

  @Column({ nullable: true })
  ip: string; // 👈 NUEVO

  @Column({ nullable: true })
  browser: string; // 👈 NUEVO

  @CreateDateColumn({ type: 'timestamp without time zone' })
  fechaHora: Date;
}