import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { AUTH_USE_CASE, AuthUseCase } from '../../../domain/ports/input';
import { CurrentStoreSession, StoreSession, StoreSessionGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { LoginDto } from './login.dto';
import { StoreLoginDto } from './store-login.dto';
import { VendedorLoginDto } from './vendedor-login.dto';

/**
 * Dois fluxos de autenticacao (ver ADR-0010):
 * - /auth/login: emergencia e-mail+senha; a loja sai do usuario, nao de DEFAULT_STORE_ID.
 * - /auth/loja/*: terminal compartilhado da loja -> nome -> PIN.
 */
@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_USE_CASE) private readonly authUseCase: AuthUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authUseCase.login({
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

  /** Pacote cifrado no painel: permite abrir o terminal e o PIN sem internet. */
  @Get('loja/offline-bundle')
  @UseGuards(StoreSessionGuard)
  async offlineBundle(@CurrentStoreSession() storeSession: StoreSession) {
    return unwrapOrThrow(await this.authUseCase.getOfflineBundle(storeSession.storeId));
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
