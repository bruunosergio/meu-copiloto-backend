import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DevolverEmprestimosDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Selecione ao menos um emprestimo.' })
  @IsString({ each: true })
  ids!: string[];

  @IsString()
  @IsNotEmpty({ message: 'Informe a quem a(s) peca(s) foi(ram) devolvida(s).' })
  devolvidoPara!: string;
}
