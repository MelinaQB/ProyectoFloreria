import { PartialType } from '@nestjs/mapped-types';
import { CreateRamoDto } from './create-ramo.dto';

export class UpdateRamoDto extends PartialType(CreateRamoDto) {}