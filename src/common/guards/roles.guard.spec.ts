import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums';

// Helper to create a mock ExecutionContext (simulates what NestJS passes to guards)
function createMockContext(userRole: UserRole | null): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userRole ? { id: 'user-1', role: userRole } : null,
      }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are specified on the route', () => {
    // No @Roles() decorator on the handler
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext(UserRole.USER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow admin access to any role-restricted route', () => {
    // Route requires VIP role
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VIP]);

    const context = createMockContext(UserRole.ADMIN);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow VIP users to access VIP routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VIP]);

    const context = createMockContext(UserRole.VIP);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny normal users from VIP-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VIP]);

    const context = createMockContext(UserRole.USER);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when no user is on the request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);

    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow when user has one of multiple required roles', () => {
    // Route accepts both USER and VIP
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.USER,
      UserRole.VIP,
    ]);

    const context = createMockContext(UserRole.USER);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny guest users from authenticated routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);

    const context = createMockContext(UserRole.GUEST);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
