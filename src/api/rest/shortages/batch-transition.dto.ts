import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShortageStatus } from '../../../domain/entities';

/**
 * Transicao em lote: um pedido em uma distribuidora cobrindo varias pecas.
 */
export class BatchTransitionDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Selecione ao menos uma falta.' })
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(ShortageStatus, { message: 'Status invalido.' })
  novoStatus!: ShortageStatus;

  @IsOptional()
  @IsString()
  motivo?: string;

  /** Distribuidora vencedora (uma para o lote todo); so aceita em CONCLUIDA. */
  @IsOptional()
  @IsString()
  distribuidoraId?: string;
}
