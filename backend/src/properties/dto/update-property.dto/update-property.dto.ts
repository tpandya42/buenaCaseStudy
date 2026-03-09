import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from '../create-property.dto/create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
