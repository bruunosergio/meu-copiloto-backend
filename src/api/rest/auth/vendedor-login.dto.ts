import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VendedorLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Selecione um vendedor.' })
  userId!: string;

  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN deve ter de 4 a 6 digitos numericos.' })
  pin!: string;
}
