import { IsOptional, IsString } from 'class-validator';

export class SetDistribuidoraDto {
  /** null/omitido limpa a distribuidora atualmente vinculada. */
  @IsOptional()
  @IsString()
  distribuidoraId?: string | null;
}
