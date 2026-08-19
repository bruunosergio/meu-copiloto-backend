import { SignOptions, TokenPayload, TokenPort } from '../../ports/output';

export class FakeTokenProvider implements TokenPort {
  sign(payload: TokenPayload, _options?: SignOptions): string {
    return `token:${JSON.stringify(payload)}`;
  }

  verify(token: string): TokenPayload {
    return JSON.parse(token.replace('token:', ''));
  }
}
