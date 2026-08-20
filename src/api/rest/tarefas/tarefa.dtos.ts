import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { TarefaStatus } from '../../../domain/entities';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da sprint e obrigatorio.' })
  nome!: string;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fim?: string;
}

export class CreateTarefaDto {
  @IsString()
  @IsNotEmpty({ message: 'O titulo da tarefa e obrigatorio.' })
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  prazo?: string;

  /** Null/ausente = backlog. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  sprintId?: string | null;
}

export class UpdateTarefaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'O titulo da tarefa e obrigatorio.' })
  titulo?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  descricao?: string | null;

  @IsOptional()
  @IsEnum(TarefaStatus, { message: 'Status de tarefa invalido.' })
  status?: TarefaStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  prazo?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  sprintId?: string | null;
}
