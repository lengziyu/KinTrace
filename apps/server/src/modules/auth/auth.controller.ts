import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MemberQuickLoginDto } from './dto/member-quick-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('member/quick-login')
  memberQuickLogin(@Body() dto: MemberQuickLoginDto) {
    return this.authService.memberQuickLogin(dto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: { user: unknown }) {
    return req.user;
  }
}
