import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  PASSWORD_MESSAGE,
  PASSWORD_REGEX,
  PHONE_REGEX,
} from '../../users/dto/profile.dto';

export class LoginDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(150)
  email: string;

  @Matches(PHONE_REGEX, { message: 'Enter a valid phone number' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}
