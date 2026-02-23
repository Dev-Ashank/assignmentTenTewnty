import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

// Custom decorator to mark which roles can access an endpoint.
// Usage: @Roles(UserRole.ADMIN, UserRole.VIP) on a controller method.
// Works together with RolesGuard to enforce access control.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
