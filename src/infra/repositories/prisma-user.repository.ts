import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from '../../domain/ports/output';
import { User } from '../../domain/entities';
import { UserMapper } from '../mappers';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(storeId: string, email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { storeId_email: { storeId, email } },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByPhone(telefoneWhatsapp: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { telefoneWhatsapp } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async listByStore(storeId: string): Promise<User[]> {
    const raws = await this.prisma.user.findMany({
      where: { storeId },
      orderBy: { nome: 'asc' },
    });
    return raws.map(UserMapper.toDomain);
  }

  async create(data: CreateUserData): Promise<User> {
    const raw = await this.prisma.user.create({
      data: {
        storeId: data.storeId,
        nome: data.nome,
        email: data.email,
        senhaHash: data.senhaHash,
        telefoneWhatsapp: data.telefoneWhatsapp,
        papel: data.papel,
      },
    });
    return UserMapper.toDomain(raw);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const raw = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.senhaHash !== undefined && { senhaHash: data.senhaHash }),
        ...(data.telefoneWhatsapp !== undefined && {
          telefoneWhatsapp: data.telefoneWhatsapp,
        }),
        ...(data.papel !== undefined && { papel: data.papel }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
    });
    return UserMapper.toDomain(raw);
  }
}
