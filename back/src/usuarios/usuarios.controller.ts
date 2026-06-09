import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('login')
  login(@Body() loginDto: { email: string; contrasena: string }) {
    return this.usuariosService.login(loginDto);
  }
  
  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  // 🔒 REGLA DE ORO: Las rutas fijas/estáticas SIEMPRE van arriba de todo
  @Get('clientes-metricas')
  obtenerMétricasClientes() {
    console.log('[Controller] Invocando métricas reales de clientes...');
    return this.usuariosService.obtenerMétricasClientes();
  }

  // Las rutas globales estándar van después
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  // 🚫 LAS RUTAS CON COMODINES (DIPARADORES DINÁMICOS) VAN AL FINAL DE TODO
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Patch(':id/rol')
  cambiarRol(
    @Param('id') id: string,
    @Body() body: { nuevoRol: string; adminId: number }
  ) {
    return this.usuariosService.cambiarRol(+id, body.nuevoRol, body.adminId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: any) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(+id);
  }
}