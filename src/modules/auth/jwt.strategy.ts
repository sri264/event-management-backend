import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthPayload } from '@/common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: AuthPayload): Promise<AuthPayload> {
    const user = await this.usersService
      .findById(payload.sub)
      .catch(() => null);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Your session is no longer valid');
    }
    return { sub: user.id, email: user.email, role: user.role };
  }
}
