import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha e obrigatoria.' })
  senha!: string;
}
