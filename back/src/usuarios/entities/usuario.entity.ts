import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('usuarios') // Nombre de la tabla en PostgreSQL
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  celular: string;

  @Column({ type: 'varchar', length: 255 })
  contrasena: string; // Aquí guardaremos el hash encriptado, no el texto plano

  @Column({ type: 'varchar', length: 20, default: 'Cliente' })
  rol: string; // Para el manejo de permisos obligatorios (Admin / Cliente)

  @Column({ type: 'boolean', default: true })
  activo: boolean; // Para cumplir con la eliminación lógica (Soft Delete)

  @CreateDateColumn()
  fechaRegistro: Date;
}
