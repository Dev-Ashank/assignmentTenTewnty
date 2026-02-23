import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Extends Passport's JWT guard with a friendlier error message.
// Without this, failed auth just returns a generic 401 with no context.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'You need to be logged in to access this endpoint. Please include a valid JWT token in the Authorization header.',
        )
      );
    }
    return user;
  }
}
