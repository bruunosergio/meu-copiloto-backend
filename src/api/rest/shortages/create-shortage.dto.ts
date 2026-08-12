import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateShortageDto {
  @IsOptional()
  @IsString()
  codigoPeca?: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome da peca e obrigatorio.' })
  nomePeca!: string;

  @IsInt({ message: 'A quantidade restante deve ser um numero inteiro.' })
  @Min(0, { message: 'A quantidade restante nao pode ser negativa.' })
  qtdRestante!: number;

  @IsOptional()
  @IsString()
  observacao?: string;
}
