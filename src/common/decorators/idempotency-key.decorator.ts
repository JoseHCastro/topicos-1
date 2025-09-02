import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-idempotency-key'] || null;
  },
);
