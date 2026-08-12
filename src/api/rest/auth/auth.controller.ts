import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_USE_CASE, AuthUseCase } from '../../../domain/ports/input';
import { unwrapOrThrow } from '../result-http.helper';
import { LoginDto } from './login.dto';

/**
 * MVP de uma unica loja: o storeId da loja piloto e resolvido no seed
 * e injetado aqui via variavel de ambiente ate existir tela de selecao de loja (Fase 4).
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_USE_CASE) private readonly authUseCase: AuthUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const storeId = this.configService.get<string>('DEFAULT_STORE_ID', 'loja-piloto');

    const result = await this.authUseCase.login({
      storeId,
      email: dto.email,
      senha: dto.senha,
    });

    const output = unwrapOrThrow(result);

    return {
      token: output.token,
      user: output.user.toPublic(),
    };
  }
}
