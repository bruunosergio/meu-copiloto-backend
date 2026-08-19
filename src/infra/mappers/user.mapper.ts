import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User({
      id: raw.id,
      storeId: raw.storeId,
      nome: raw.nome,
      email: raw.email,
      senhaHash: raw.senhaHash,
      usuario: raw.usuario,
      pinHash: raw.pinHash,
      telefoneWhatsapp: raw.telefoneWhatsapp,
      papel: raw.papel as User['papel'],
      ativo: raw.ativo,
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }
}
