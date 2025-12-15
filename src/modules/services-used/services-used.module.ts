import { Module } from '@nestjs/common';
import { ServicesUsedController } from './services-used.controller';
import { ServicesUsedService } from './services-used.service';
import { Services } from 'src/entities/entities/services.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Services])],
  controllers: [ServicesUsedController],
  providers: [ServicesUsedService]
})
export class ServicesUsedModule { }
