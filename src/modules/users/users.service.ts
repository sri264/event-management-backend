import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '@/common/enums';
import { ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { User } from './user.entity';

const SALT_ROUNDS = 10;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  city?: string | null;
  role?: UserRole;
  isActive?: boolean;
}

export const toPublicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  city: user.city,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  hashPassword(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmailWithSecrets(email: string) {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.refreshTokenHash'])
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .getOne();
  }

  findByIdWithSecrets(id: number) {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.refreshTokenHash'])
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(input: CreateUserInput): Promise<User> {
    const email = input.email.toLowerCase().trim();
    const exists = await this.usersRepo.exists({ where: { email } });
    if (exists) {
      throw new ConflictException('An account with this email already exists');
    }
    const user = this.usersRepo.create({
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      role: input.role ?? UserRole.CUSTOMER,
      isActive: input.isActive ?? true,
      passwordHash: await this.hashPassword(input.password),
    });
    const saved = await this.usersRepo.save(user);
    return this.findById(saved.id);
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || null;
    if (dto.city !== undefined) user.city = dto.city.trim() || null;
    await this.usersRepo.save(user);
    return this.findById(id);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findByIdWithSecrets(id);
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }
    await this.usersRepo.update(id, {
      passwordHash: await this.hashPassword(dto.newPassword),
    });
  }

  async setRefreshTokenHash(id: number, hash: string | null) {
    await this.usersRepo.update(id, { refreshTokenHash: hash });
  }

  async markLoggedIn(id: number) {
    await this.usersRepo.update(id, { lastLoginAt: new Date() });
  }
}
