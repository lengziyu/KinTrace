import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1\d{10}$/, {
    message: '请输入正确的 11 位手机号',
  })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
