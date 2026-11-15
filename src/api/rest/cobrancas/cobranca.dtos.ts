import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { CobrancaAtencao, CobrancaStatus } from '../../../domain/entities';

export class ImportCobrancaDto {
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'A referencia precisa ser DD/MM/AAAA.' })
  referencia!: string;

  @IsOptional()
  @IsString()
  fonte?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'O relatorio precisa ter clientes.' })
  clientes!: unknown[];
}

export class UpdateCobrancaClienteDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  telefone?: string | null;

  @IsOptional()
  @IsEnum(CobrancaStatus, { message: 'Status de cobranca invalido.' })
  status?: CobrancaStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data da promessa precisa ser AAAA-MM-DD.' })
  promessa?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  anotacao?: string | null;
}

export class UpdateCobrancaConfigDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o DDD padrao.' })
  dddPadrao!: string;
}

export class CreateCobrancaRegraDto {
  @IsEnum(CobrancaAtencao, { message: 'Tipo de excecao invalido.' })
  tipo!: CobrancaAtencao;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  codigoCliente?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  nomeContem?: string | null;
}
