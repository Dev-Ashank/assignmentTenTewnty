import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Convenience decorator to pull the current user from the request object.
// Instead of doing req.user everywhere, just use @CurrentUser() in your controller params.
// Example: @CurrentUser() user: User
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
