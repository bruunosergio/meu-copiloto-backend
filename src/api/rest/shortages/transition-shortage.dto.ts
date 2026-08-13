import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShortageStatus } from '../../../domain/entities';

export class TransitionShortageDto {
  @IsEnum(ShortageStatus, { message: 'Status invalido.' })
  novoStatus!: ShortageStatus;

  @IsOptional()
  @IsString()
  motivo?: string;

  /** Distribuidora vencedora; so aceita ao transicionar para COMPRADA. */
  @IsOptional()
  @IsString()
  distribuidoraId?: string;
}
