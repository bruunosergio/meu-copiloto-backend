import { PasswordHasherPort } from '../../ports/output';

/** Fake determinístico: evita depender de bcrypt real nos testes de unidade. */
export class FakePasswordHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
