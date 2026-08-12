import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
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
  telefoneWhatsapp?: string | null;

  @IsOptional()
  @IsEnum(Role, { message: 'Papel invalido. Use ADMIN, VENDEDOR ou COMPRADOR.' })
  papel?: Role;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
