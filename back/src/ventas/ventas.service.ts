import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from './entities/venta.entity';
import { Ramo } from '../ramos/entities/ramo.entity';
import { Material } from '../materiales/entities/material.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateVentaDto } from './dto/create-venta.dto';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    @InjectRepository(Ramo)
    private readonly ramoRepository: Repository<Ramo>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async registrarVenta(createVentaDto: CreateVentaDto): Promise<Venta> {
    const { ramoId, cantidad, adminId } = createVentaDto;

    // 1. Validar existencia del ramo y traer su receta vinculada
    const ramo = await this.ramoRepository.findOne({
      where: { id: ramoId, activo: true },
      relations: { receta: { material: true } }
    });
    if (!ramo) throw new BadRequestException('El ramo seleccionado no existe en el catálogo.');

    // 2. Simulación de Stock: Validar unidades reales totales (Paquetes + Sueltas) antes de alterar la BD
    for (const item of ramo.receta) {
      const material = item.material;
      // 🧮 Total real físico disponible en el taller = (Paquetes * Unidades por paquete) + Unidades Sueltas
      const unidadesTotalesEnAlmacen = (material.stock * material.unidadesPorPaquete) + material.unidadesSueltas;
      const unidadesRequeridasOperacion = item.cantidadNecesaria * cantidad;

      if (unidadesRequeridasOperacion > unidadesTotalesEnAlmacen) {
        throw new BadRequestException(
          `Falta de inventario: Para producir ${cantidad}x "${ramo.nombre}" se requieren ${unidadesRequeridasOperacion}u de "${material.nombre}". Actualmente solo dispones de ${unidadesTotalesEnAlmacen}u en almacenes (unidades sueltas incluidas).`
        );
      }
    }

    // 3. PASO TRANSACCIONAL CRÍTICO: Descontar material rebajando unidades sueltas y recalculando empaques
    for (const item of ramo.receta) {
      const material = await this.materialRepository.findOne({ where: { id: item.material.id } });
      if (material) {
        // Calcular el gran total de unidades antes de la venta
        const unidadesTotalesEnAlmacen = (material.stock * material.unidadesPorPaquete) + material.unidadesSueltas;
        const unidadesRequeridasOperacion = item.cantidadNecesaria * cantidad;
        
        // Obtener el saldo real absoluto neto
        const saldoUnidadesNeto = unidadesTotalesEnAlmacen - unidadesRequeridasOperacion;
        
        // 🔒 REEMPAQUETADO AUTOMÁTICO EN POSTGRESQL
        // El nuevo stock es la división entera (cuántos paquetes cerrados completos quedan)
        material.stock = Math.floor(saldoUnidadesNeto / material.unidadesPorPaquete);
        
        // Las unidades sueltas son el residuo exacto que no llega a armar un paquete entero
        material.unidadesSueltas = saldoUnidadesNeto % material.unidadesPorPaquete;
        
        await this.materialRepository.save(material);
      }
    }

    // 4. Persistir la venta en PostgreSQL
    const totalBs = Number(ramo.precio) * cantidad;
    const nuevaVenta = this.ventaRepository.create({
      ramo,
      cantidad,
      totalBs,
      admin: { id: adminId } as Usuario
    });

    const ventaGuardada = await this.ventaRepository.save(nuevaVenta);

    // 🔒 Registro automático en tu Bitácora de Auditoría
    const admin = await this.usuarioRepository.findOne({ where: { id: adminId } });
    const emailAdmin = admin ? admin.email : 'sistema@hanami.com';
    
    await this.auditoriaService.registrarLog(
      adminId,
      emailAdmin,
      'TRANSACCION_VENTA',
      `Pedido Procesado: Se vendieron ${cantidad} unidades de [${ramo.nombre}] por un valor de ${totalBs} Bs. Insumos rebajados con éxito.`
    );

    return ventaGuardada;
  }

  async obtenerTodas(): Promise<Venta[]> {
    return await this.ventaRepository.find({
      order: { fechaVenta: 'DESC' },
      relations: {
        ramo: true,
        admin: true
      }
    });
  }
}