import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from '../ventas/entities/venta.entity';

@Controller('estadisticas')
export class EstadisticasController {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
  ) {}

  @Get('dashboard')
  async obtenerDatosDashboard() {
    // Consulta avanzada para agrupar ventas e ingresos por los días de la semana en PostgreSQL
    const datosRaw = await this.ventaRepository
      .createQueryBuilder('venta')
      .select("TO_CHAR(venta.fechaVenta, 'DY')", 'dia') // Trae 'MON', 'TUE', 'WED', etc.
      .addSelect('SUM(venta.totalBs)', 'ingresos')
      .addSelect('SUM(venta.cantidad)', 'ramosVendidos')
      .where("venta.fechaVenta >= NOW() - INTERVAL '7 days'") // Últimos 7 días
      .groupBy("TO_CHAR(venta.fechaVenta, 'DY')")
      .getRawMany();

    // Mapeo para traducir los días al español y asegurar que React reciba números limpios
    const diasEspañol: { [key: string]: string } = {
      'MON': 'Lun', 'TUE': 'Mar', 'WED': 'Mié', 'THU': 'Jue', 'FRI': 'Vie', 'SAT': 'Sáb', 'SUN': 'Dom'
    };

    return datosRaw.map(d => ({
      name: diasEspañol[d.dia.toUpperCase()] || d.dia,
      ingresos: Number(d.ingresos || 0),
      carga: Number(d.ramosVendidos || 0)
    }));
  }
}