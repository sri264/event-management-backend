import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { UserRole } from '@/common/enums';
import { toPublicUser, UsersService } from '../users/users.service';
import { AuthResult, AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const REFRESH_COOKIE = 'en_refresh';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    const env = this.config.get<string>('app.env');
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: env === 'prod' || env === 'production',
      path: `/${this.config.get<string>('app.apiPrefix')}/auth`,
      maxAge: WEEK_MS,
    };
  }

  private respond(res: Response, result: AuthResult) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, this.cookieOptions());
    return { user: result.user, accessToken: result.accessToken };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  @ResponseMessage('Account created successfully')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.authService.register(dto));
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged in successfully')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(
      res,
      await this.authService.login(dto, UserRole.CUSTOMER),
    );
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged in successfully')
  async adminLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.authService.login(dto, UserRole.ADMIN));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Session refreshed')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return this.respond(
        res,
        await this.authService.refresh(req.cookies?.[REFRESH_COOKIE]),
      );
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, { path: this.cookieOptions().path });
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out successfully')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutByRefreshToken(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: this.cookieOptions().path });
    return null;
  }

  @ApiBearerAuth()
  @Get('me')
  @ResponseMessage('Current user fetched')
  async me(@CurrentUser('sub') userId: number) {
    return toPublicUser(await this.usersService.findById(userId));
  }
}
