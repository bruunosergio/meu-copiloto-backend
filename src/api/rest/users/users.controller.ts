import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../../domain/entities';
import {
  USER_MANAGEMENT_USE_CASE,
  UserManagementUseCase,
} from '../../../domain/ports/input';
import { CurrentUser, JwtAuthGuard, RequestUser, Roles, RolesGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    @Inject(USER_MANAGEMENT_USE_CASE) private readonly userManagementUseCase: UserManagementUseCase,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  async list(@CurrentUser() currentUser: RequestUser) {
    const result = await this.userManagementUseCase.listByStore(currentUser.storeId);
    const users = unwrapOrThrow(result);
    return users.map((user) => user.toPublic());
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async getById(@Param('id') id: string) {
    const result = await this.userManagementUseCase.getById(id);
    const user = unwrapOrThrow(result);
    return user.toPublic();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.userManagementUseCase.create({
      storeId: currentUser.storeId,
      nome: dto.nome,
      email: dto.email,
      senha: dto.senha,
      usuario: dto.usuario,
      pin: dto.pin,
      telefoneWhatsapp: dto.telefoneWhatsapp ?? null,
      papel: dto.papel,
    });
    const user = unwrapOrThrow(result);
    return user.toPublic();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const result = await this.userManagementUseCase.update(id, dto);
    const user = unwrapOrThrow(result);
    return user.toPublic();
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  async deactivate(@Param('id') id: string) {
    const result = await this.userManagementUseCase.deactivate(id);
    const user = unwrapOrThrow(result);
    return user.toPublic();
  }
}
