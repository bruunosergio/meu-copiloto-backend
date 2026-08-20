import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../../../domain/entities';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres.' })
  senha?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,20}$/, {
    message: 'Usuario deve ter 3-20 caracteres: letras, numeros, ".", "_" ou "-".',
  })
  usuario?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN deve ter de 4 a 6 digitos numericos.' })
  pin?: string;

  @IsOptional()
  @IsString()
  telefoneWhatsapp?: string | null;

  @IsOptional()
  @IsEnum(Role, { message: 'Papel invalido. Use ADMIN, VENDEDOR, COMPRADOR ou GERENTE.' })
  papel?: Role;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
