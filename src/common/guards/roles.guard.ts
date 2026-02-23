import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums';

// This guard checks if the authenticated user has the right role for an endpoint.
// It reads the @Roles() metadata from the handler and compares it to the user's role.
// If no roles are specified on the route, access is granted to any authenticated user.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Grab the roles required for this route (set via @Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, the route is open to all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // If somehow there's no user on the request, deny access
    if (!user) {
      throw new ForbiddenException('You must be logged in to access this resource');
    }

    // Admin always gets in — they're the superuser
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if the user's role matches any of the required roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
