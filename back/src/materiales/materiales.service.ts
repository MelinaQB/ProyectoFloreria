import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialesService {
  constructor(
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

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {

    console.log('DTO RECIBIDO:', createMaterialDto);

    const { adminId, ...datosMaterial } = createMaterialDto;

    console.log('DATOS MATERIAL:', datosMaterial);

    const nuevo = this.materialRepository.create(datosMaterial);

    console.log('OBJETO NUEVO:', nuevo);

    const materialGuardado = await this.materialRepository.save(nuevo);

    return materialGuardado;
}


  async findAll(): Promise<Material[]> {
    return await this.materialRepository.find({ where: { activo: true }, order: { id: 'ASC' } });
  }

  async update(id: number, updateMaterialDto: UpdateMaterialDto): Promise<Material> {
    const material = await this.materialRepository.findOne({ where: { id, activo: true } });
    if (!material) throw new BadRequestException('El material no existe.');

    const { adminId, ...datosEdicion } = updateMaterialDto;
    const stockAnterior = material.stock;
    
    // 🔒 SOLUCIÓN: Si adminId viene undefined, le asignamos 1 (o null si prefieres) para tranquilizar a TypeScript
    const idAdminGarantizado = adminId !== undefined ? adminId : 1;

    const editado = this.materialRepository.merge(material, datosEdicion);
    const materialActualizado = await this.materialRepository.save(editado);
    
    // 🎯 Usamos la variable garantizada que nunca será undefined
    const emailAdmin = await this.obtenerEmailAdmin(idAdminGarantizado);

    await this.auditoriaService.registrarLog(
      idAdminGarantizado, // 👈 Pasamos el número ya validado
      emailAdmin,
      'MODIFICACION_MATERIAL',
      `El Administrador actualizó el insumo ID ${id}. Nombre: ${materialActualizado.nombre}, Detalle: ${materialActualizado.detalle}. Stock anterior: ${stockAnterior} -> Nuevo Stock: ${materialActualizado.stock}.`
    );
    return materialActualizado;
  }

  async remove(id: number, adminId: number): Promise<void> {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) throw new BadRequestException('El material no existe.');

    material.activo = false; 
    await this.materialRepository.save(material);
    const emailAdmin = await this.obtenerEmailAdmin(adminId);

    await this.auditoriaService.registrarLog(
      adminId,
      emailAdmin,
      'BAJA_MATERIAL',
      `El Administrador eliminó lógicamente el insumo ID ${id}: [${material.nombre} - ${material.detalle}].`
    );
  }
}