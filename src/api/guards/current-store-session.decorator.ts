import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { StoreSession } from './store-session.guard';

export const CurrentStoreSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StoreSession => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.storeSession as StoreSession;
  },
);
