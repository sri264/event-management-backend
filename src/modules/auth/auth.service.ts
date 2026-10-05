import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { AuthPayload } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums';
import { User } from '../users/user.entity';
import { toPublicUser, UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface AuthResult {
  user: ReturnType<typeof toPublicUser>;
  accessToken: string;
  refreshToken: string;
}

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const user = await this.usersService.create({
      ...dto,
      role: UserRole.CUSTOMER,
    });
    return this.issueSession(user);
  }

  async login(dto: LoginDto, role: UserRole): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithSecrets(dto.email);
    const valid =
      user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    if (user.role !== role) {
      throw new ForbiddenException(
        role === UserRole.ADMIN
          ? 'This account does not have admin access'
          : 'Admins must sign in from the admin login page',
      );
    }
    if (!user.isActive) {
      throw new ForbiddenException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    await this.usersService.markLoggedIn(user.id);
    return this.issueSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) throw new UnauthorizedException('Please sign in');

    let payload: AuthPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Your session has expired');
    }

    const user = await this.usersService.findByIdWithSecrets(payload.sub);
    if (
      !user ||
      !user.isActive ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== sha256(refreshToken)
    ) {
      throw new UnauthorizedException('Your session has expired');
    }
    return this.issueSession(user);
  }

  async logout(userId: number) {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  /** Revokes the session that owns this refresh token, if it is still valid. */
  async logoutByRefreshToken(refreshToken: string | undefined) {
    if (!refreshToken) return;
    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(
        refreshToken,
        { secret: this.config.get<string>('jwt.refreshSecret') },
      );
      await this.logout(payload.sub);
    } catch {
      // Expired or tampered tokens have nothing left to revoke.
    }
  }

  private async issueSession(user: User): Promise<AuthResult> {
    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(
        { ...payload, jti: randomUUID() },
        {
          secret: this.config.get<string>('jwt.refreshSecret'),
          expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
        },
      ),
    ]);
    await this.usersService.setRefreshTokenHash(user.id, sha256(refreshToken));
    const fresh = await this.usersService.findById(user.id);
    return { user: toPublicUser(fresh), accessToken, refreshToken };
  }
}
