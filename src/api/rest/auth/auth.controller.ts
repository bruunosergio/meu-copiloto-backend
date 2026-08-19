import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_USE_CASE, AuthUseCase } from '../../../domain/ports/input';
import { CurrentStoreSession, StoreSession, StoreSessionGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { LoginDto } from './login.dto';
import { StoreLoginDto } from './store-login.dto';
import { VendedorLoginDto } from './vendedor-login.dto';

/**
 * MVP de uma unica loja: o storeId da loja piloto e resolvido no seed
 * e injetado aqui via variavel de ambiente ate existir tela de selecao de loja (Fase 4).
 *
 * Dois fluxos de autenticacao (ver ADR-0007):
 * - /auth/login: ADMIN/COMPRADOR, e-mail+senha, de qualquer lugar.
 * - /auth/loja/*: terminal compartilhado da loja -> escolha do vendedor -> PIN.
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

  @Post('loja/login')
  @HttpCode(HttpStatus.OK)
  async loginLoja(@Body() dto: StoreLoginDto) {
    const result = await this.authUseCase.loginStore({ codigo: dto.codigo, senha: dto.senha });
    return unwrapOrThrow(result);
  }

  @Get('loja/vendedores')
  @UseGuards(StoreSessionGuard)
  async listVendedores(@CurrentStoreSession() storeSession: StoreSession) {
    const result = await this.authUseCase.listVendedoresParaLogin(storeSession.storeId);
    return unwrapOrThrow(result);
  }

  @Post('loja/vendedor-login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StoreSessionGuard)
  async loginVendedor(
    @Body() dto: VendedorLoginDto,
    @CurrentStoreSession() storeSession: StoreSession,
  ) {
    const result = await this.authUseCase.loginVendedor({
      storeId: storeSession.storeId,
      userId: dto.userId,
      pin: dto.pin,
    });

    const output = unwrapOrThrow(result);

    return {
      token: output.token,
      user: output.user.toPublic(),
    };
  }
}
