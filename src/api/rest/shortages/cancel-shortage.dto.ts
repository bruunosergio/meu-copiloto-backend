import { IsNotEmpty, IsString } from 'class-validator';

export class CancelShortageDto {
  @IsString()
  @IsNotEmpty({ message: 'O motivo do cancelamento e obrigatorio.' })
  motivo!: string;
}
