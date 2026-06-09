import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ramo } from './entities/ramo.entity';
import { RamoMaterial } from './entities/ramo-material.entity';
import { Material } from '../materiales/entities/material.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateRamoDto } from './dto/create-ramo.dto';
import { UpdateRamoDto } from './dto/update-ramo.dto';

@Injectable()
export class RamosService {
  constructor(
    @InjectRepository(Ramo)
    private readonly ramoRepository: Repository<Ramo>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private async obtenerEmailAdmin(adminId: number): Promise<string> {
    if (!adminId) return 'admin_sistema@hanami.com';
    const admin = await this.usuarioRepository.findOne({ where: { id: adminId } });
    return admin ? admin.email : 'admin_sistema@hanami.com';
  }

  async create(createRamoDto: CreateRamoDto): Promise<Ramo> {
    const { nombre, precio, adminId, materiales } = createRamoDto;

    // 1. Crear el cascarón del Ramo
    const nuevoRamo = this.ramoRepository.create({ nombre, precio });
    nuevoRamo.receta = [];

    // 2. Mapear e insertar los materiales de la receta uno por uno
    for (const item of materiales) {
      const mat = await this.materialRepository.findOne({ where: { id: item.materialId, activo: true } });
      if (!mat) throw new BadRequestException(`El material con ID ${item.materialId} no existe.`);

      const filaReceta = new RamoMaterial();
      filaReceta.material = mat;
      filaReceta.cantidadNecesaria = item.cantidadNecesaria;
      nuevoRamo.receta.push(filaReceta);
    }

    const ramoGuardado = await this.ramoRepository.save(nuevoRamo);
    const emailAdmin = await this.obtenerEmailAdmin(adminId);

    // 🔒 Guardar log real en PostgreSQL
    await this.auditoriaService.registrarLog(
      adminId,
      emailAdmin,
      'CREACION_RAMO',
      `Se registró el catálogo del Ramo [${ramoGuardado.nombre}] con un precio de ${ramoGuardado.precio} Bs.`
    );

    return ramoGuardado;
  }

  async findAll(): Promise<Ramo[]> {
    return await this.ramoRepository.find({
      where: { activo: true },
      relations: {
        receta: true // 🔒 SOLUCIÓN: Cambiamos ['receta'] por un objeto estricto. ¡Así TypeORM y TypeScript quedan felices!
      },
      order: { id: 'ASC' },
    });
  }

  async update(id: number, updateRamoDto: UpdateRamoDto): Promise<Ramo> {
    const ramo = await this.ramoRepository.findOne({ where: { id, activo: true } });
    if (!ramo) throw new BadRequestException('El ramo solicitado no existe.');

    const { adminId, nombre, precio } = updateRamoDto;
    const idAdminGarantizado = adminId !== undefined ? adminId : 1;

    if (nombre) ramo.nombre = nombre;
    if (precio) ramo.precio = precio;

    const ramoActualizado = await this.ramoRepository.save(ramo);
    const emailAdmin = await this.obtenerEmailAdmin(idAdminGarantizado);

    await this.auditoriaService.registrarLog(
      idAdminGarantizado,
      emailAdmin,
      'MODIFICACION_RAMO',
      `Se editaron los datos generales del ramo ID ${id} (${ramoActualizado.nombre}).`
    );

    return ramoActualizado;
  }

  async remove(id: number, adminId: number): Promise<void> {
    const ramo = await this.ramoRepository.findOne({ where: { id } });
    if (!ramo) throw new BadRequestException('El ramo no existe.');

    ramo.activo = false; // Soft Delete
    await this.ramoRepository.save(ramo);
    const emailAdmin = await this.obtenerEmailAdmin(adminId);

    await this.auditoriaService.registrarLog(
      adminId,
      emailAdmin,
      'BAJA_RAMO',
      `El Administrador eliminó lógicamente el ramo ID ${id}: [${ramo.nombre}].`
    );
  }
}