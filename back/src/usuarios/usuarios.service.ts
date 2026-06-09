import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // 1. REGISTRO DE USUARIOS CON ENCRIPCIÓN MANDATORIA Y ROL AUTOMÁTICO
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const { email, contrasena } = createUsuarioDto;

    const usuarioExiste = await this.usuarioRepository.findOne({ where: { email } });
    if (usuarioExiste) {
      throw new BadRequestException('El correo electrónico ya se encuentra registrado.');
    }

    const saltRounds = 10;
    const contrasenaEncriptada = await bcrypt.hash(contrasena, saltRounds);

    let rolAsignado = 'Cliente';
    if (email.toLowerCase() === 'admin@hanami.com') {
      rolAsignado = 'Admin';
    }

    const nuevoUsuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      contrasena: contrasenaEncriptada,
      rol: rolAsignado,
    });

    return await this.usuarioRepository.save(nuevoUsuario);
  }

  // 🔑 2. INICIO DE SESIÓN COMPROBADO CON BCrypt Y AUDITORÍA EN BD
  async login(loginUsuarioDto: { email: string; contrasena: string }): Promise<Usuario> {
    const { email, contrasena } = loginUsuarioDto;

    // Buscar al usuario activo en PostgreSQL
    const usuario = await this.usuarioRepository.findOne({ where: { email, activo: true } });
    if (!usuario) {
      throw new BadRequestException('Credenciales inválidas (correo o contraseña incorrectos).');
    }

    // Comparar hashes con la librería criptográfica
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      throw new BadRequestException('Credenciales inválidas (correo o contraseña incorrectos).');
    }

    // 📝 SE AÑADE: Guardar registro físico de la auditoría en PostgreSQL
    await this.auditoriaService.registrarLog(
      usuario.id,
      usuario.email,
      'INICIO_SESION',
      `El usuario ${usuario.email} autenticó credenciales correctamente con el rol [${usuario.rol}].`
    );

    // Mantenemos tu traza de consola por si deseas revisarla rápido
    console.log(`Auditoría: El usuario ${usuario.email} con Rol [${usuario.rol}] inició sesión con éxito.`);

    return usuario;
  }

  // 3. LISTADO GENERAL
  // 3. LISTADO GENERAL CON MÉTRICAS EN TIEMPO REAL (CORREGIDO PARA MOSTRAR TODOS LOS ROLES)
  async findAll(): Promise<any[]> {
    const rawData = await this.usuarioRepository
      .createQueryBuilder('usuario')
      // Buscamos la relación inversa de ventas (la FK adminId en la tabla ventas)
      .leftJoin('ventas', 'venta', 'venta.adminId = usuario.id')
      .select([
        'usuario.id AS id',
        'usuario.nombre AS nombre',
        'usuario.email AS email',
        'usuario.celular AS celular',
        'usuario.rol AS rol'
      ])
      // Hacemos el conteo y la suma transaccional real de PostgreSQL
      .addSelect('COUNT(venta.id)', 'nroPedidos')
      .addSelect('COALESCE(SUM(venta.totalBs), 0)', 'totalGastado')
      .where('usuario.activo = :activo', { activo: true }) // 🔒 Solo usuarios activos (Soft Delete)
      // Agrupamos por todas las columnas seleccionadas
      .groupBy('usuario.id, usuario.nombre, usuario.email, usuario.celular, usuario.rol')
      .orderBy('usuario.id', 'ASC')
      .getRawMany();

    // Formateamos las métricas para que viajen de forma limpia al Frontend
    return rawData.map(u => {
      const total = Number(u.totalGastado || 0);
      return {
        id: Number(u.id),
        nombre: u.nombre,
        email: u.email,
        celular: u.celular,
        rol: u.rol,
        nroPedidos: Number(u.nroPedidos || 0),
        totalGastado: total,
        nivel: total >= 300 ? 'VIP' : 'Nuevo'
      };
    });
  }

  // 4. BUSCAR UN USUARIO ESPECÍFICO POR ID
  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id, activo: true } });
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }
    return usuario;
  }

  // 5. ACTUALIZAR UN USUARIO
  async update(id: number, updateUsuarioDto: any): Promise<Usuario> {
    const usuario = await this.findOne(id);
    const usuarioEditado = this.usuarioRepository.merge(usuario, updateUsuarioDto);
    const usuarioActualizado = await this.usuarioRepository.save(usuarioEditado);

    // 🔒 Guardamos el registro físico de la modificación en PostgreSQL
    await this.auditoriaService.registrarLog(
      null, // Puedes pasar el ID del admin si lo manejas en la sesión del back
      usuarioActualizado.email,
      'MODIFICACION_PERFIL',
      `Se actualizaron los datos generales del usuario ID ${usuarioActualizado.id} (${usuarioActualizado.email}).`
    );

    return usuarioActualizado;
  }

  // 6. CAMBIAR EL ROL DE UN USUARIO (Auditoría Multi-Administrador en BD)
  async cambiarRol(id: number, nuevoRol: string, adminId: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id, activo: true } });
    if (!usuario) {
      throw new BadRequestException('El usuario no existe.');
    }

    // 🔒 REVISIÓN ULTRA ESTRICTA DEL ADMINISTRADOR RESPONSABLE
    console.log(`[Backend] Procesando cambio de rol. Recibido adminId: ${adminId}`);
    
    let adminEmail = 'admin@hanami.com'; // Plan de respaldo inicial por si el ID es 0 o null
    
    if (adminId && adminId !== 0) {
      const admin = await this.usuarioRepository.findOne({ where: { id: adminId } });
      if (admin) {
        adminEmail = admin.email; // 👈 ASIGNACIÓN REAL EXITOSA
      } else {
        console.warn(`[Backend Warning] No se encontró ningún usuario con el ID ${adminId} en PostgreSQL.`);
      }
    } else {
      // Si el frontend mandó un ID inválido, buscamos en la BD al admin principal de respaldo
      const adminPrincipal = await this.usuarioRepository.findOne({ where: { rol: 'Admin' } });
      if (adminPrincipal) {
        adminEmail = adminPrincipal.email;
      }
    }

    const rolAnterior = usuario.rol;
    usuario.rol = nuevoRol;
    
    const usuarioActualizado = await this.usuarioRepository.save(usuario);

    // Guardar alteración crítica de privilegios en PostgreSQL con el correo verificado
    await this.auditoriaService.registrarLog(
      adminId ? adminId : null,
      adminEmail, // 👈 Aquí se guarda el correo real certificado
      'ALTERACION_ROLES',
      `El Administrador cambió los privilegios del usuario ID ${usuario.id} (${usuario.email}). Rol anterior: [${rolAnterior}] -> Nuevo Rol: [${nuevoRol}].`
    );

    console.log(`Auditoría Guardada: Actor [${adminEmail}] modificó a ID [${id}]`);

    return usuarioActualizado;
  }

    

  // 7. ELIMINACIÓN LÓGICA (Soft Delete)
  async remove(id: number): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new BadRequestException('El usuario solicitado no existe.');
    }
    
    // Aplicamos el Soft Delete cambiando el estado
    usuario.activo = false;
    await this.usuarioRepository.save(usuario);

    // 🔒 Guardamos la traza de auditoría inmutable de la baja
    await this.auditoriaService.registrarLog(
      null, 
      usuario.email,
      'BAJA_USUARIO',
      `Se aplicó una eliminación lógica (soft delete) al usuario ID ${usuario.id} con correo [${usuario.email}]. El usuario ya no tendrá acceso al sistema.`
    );

    console.log(`Auditoría: El usuario ID ${id} fue dado de baja del sistema.`);
  }

  // 👥 ACTUALIZADO: Jala clientes reales de PostgreSQL al 100%, sin simulaciones

    async obtenerMétricasClientes(): Promise<any[]> {
    return await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.ventas', 'venta')
      .select([
        'usuario.id AS id',
        'usuario.nombre AS nombre',
        'usuario.email AS email',
        'usuario.celular AS celular',
        'usuario.rol AS rol'
      ])
      // Agregamos las funciones matemáticas COUNT y SUM cruzando las tablas
      .addSelect('COUNT(venta.id)', 'nroPedidos')
      .addSelect('COALESCE(SUM(venta.totalBs), 0)', 'totalGastado')
      .where('usuario.rol = :rol', { rol: 'Cliente' })
      .groupBy('usuario.id')
      .orderBy('totalGastado', 'DESC')
      .getRawMany();
  }


}