import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateShortageDto {
  @IsOptional()
  @IsString()
  codigoPeca?: string | null;

  @IsOptional()
  @IsString()
  nomePeca?: string;

  @IsOptional()
  @IsInt({ message: 'A quantidade restante deve ser um numero inteiro.' })
  @Min(0, { message: 'A quantidade restante nao pode ser negativa.' })
  qtdRestante?: number;

  @IsOptional()
  @IsString()
  observacao?: string | null;

  @IsOptional()
  @IsBoolean()
  emprestada?: boolean;

  @IsOptional()
  @IsString()
  emprestadaDe?: string | null;
}
