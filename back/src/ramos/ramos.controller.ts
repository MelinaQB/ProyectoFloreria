import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RamosService } from './ramos.service';
import { CreateRamoDto } from './dto/create-ramo.dto';
import { UpdateRamoDto } from './dto/update-ramo.dto';

@Controller('ramos')
export class RamosController {
  constructor(private readonly ramosService: RamosService) {}

  @Post()
  create(@Body() createRamoDto: CreateRamoDto) {
    return this.ramosService.create(createRamoDto);
  }

  @Get()
  findAll() {
    return this.ramosService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRamoDto: UpdateRamoDto) {
    return this.ramosService.update(+id, updateRamoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('adminId') adminId: string) {
    return this.ramosService.remove(+id, +adminId);
  }
}