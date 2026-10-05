import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { UserRole } from '@/common/enums';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'password_hash', length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 100,
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null;
}
