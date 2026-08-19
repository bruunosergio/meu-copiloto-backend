import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { Role } from '../../../domain/entities';

/**
 * ADMIN/COMPRADOR: e-mail+senha. VENDEDOR: usuario+PIN (ver ADR-0007).
 * A validacao condicional aqui e so a primeira camada (UX rapida no formulario);
 * a regra de negocio definitiva vive em UserManagementUseCaseImpl.
 */
export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter ao menos 2 caracteres.' })
  nome!: string;

  @IsEnum(Role, { message: 'Papel invalido. Use ADMIN, VENDEDOR ou COMPRADOR.' })
  papel!: Role;

  @ValidateIf((dto) => dto.papel !== Role.VENDEDOR)
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  email?: string;

  @ValidateIf((dto) => dto.papel !== Role.VENDEDOR)
  @IsString()
  @MinLength(8, { message: 'A senha deve ter ao menos 8 caracteres.' })
  senha?: string;

  @ValidateIf((dto) => dto.papel === Role.VENDEDOR)
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,20}$/, {
    message: 'Usuario deve ter 3-20 caracteres: letras, numeros, ".", "_" ou "-".',
  })
  usuario?: string;

  @ValidateIf((dto) => dto.papel === Role.VENDEDOR)
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN deve ter de 4 a 6 digitos numericos.' })
  pin?: string;

  @IsOptional()
  @IsString()
  telefoneWhatsapp?: string;
}
