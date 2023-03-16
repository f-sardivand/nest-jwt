import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResetController } from './reset.controller';
import { Reset } from './reset.entity';
import { ResetService } from './reset.service';

@Module({
  imports:[TypeOrmModule.forFeature([Reset])],
  controllers: [ResetController],
  providers: [ResetService]
})
export class ResetModule {}
