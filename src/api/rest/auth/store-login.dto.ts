import { IsNotEmpty, IsString } from 'class-validator';

export class StoreLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O codigo da loja e obrigatorio.' })
  codigo!: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha da loja e obrigatoria.' })
  senha!: string;
}
