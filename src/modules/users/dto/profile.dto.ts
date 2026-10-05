import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PHONE_REGEX = /^[+]?[0-9\s-]{10,15}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
export const PASSWORD_MESSAGE =
  'Password must be 8-64 characters and include at least one letter and one number';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'Enter a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
