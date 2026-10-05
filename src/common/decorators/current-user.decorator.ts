import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums';

export interface AuthPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (field: keyof AuthPayload | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as AuthPayload;
    return field ? user?.[field] : user;
  },
);
