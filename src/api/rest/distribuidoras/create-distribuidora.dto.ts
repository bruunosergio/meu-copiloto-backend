import { IsString, MinLength } from 'class-validator';

export class CreateDistribuidoraDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  nome!: string;
}
