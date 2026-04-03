import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    // Explicitly type the request to include the user object attached by Passport
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
