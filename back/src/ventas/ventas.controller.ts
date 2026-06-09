import { Controller, Get, Post, Body } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  registrarVenta(@Body() createVentaDto: CreateVentaDto) {
    return this.ventasService.registrarVenta(createVentaDto);
  }

  @Get()
  obtenerTodas() {
    return this.ventasService.obtenerTodas();
  }
}