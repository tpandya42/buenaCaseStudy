import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertiesPrismaService } from './properties.prisma.service';
import { PropertyValidationService } from './validators/property-validation/property-validation.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesPrismaService, PropertyValidationService]
})

export class PropertiesModule {}
