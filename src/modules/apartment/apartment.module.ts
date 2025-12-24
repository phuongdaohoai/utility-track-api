import { Module } from '@nestjs/common';
import { ApartmentController } from './apartment.controller';
import { ApartmentService } from './apartment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apartments } from 'src/entities/apartments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Apartments])],
  controllers: [ApartmentController],
  providers: [ApartmentService],
  exports: [ApartmentService],
})
export class ApartmentModule { }
