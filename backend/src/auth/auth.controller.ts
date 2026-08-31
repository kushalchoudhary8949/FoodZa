import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { CurrentUser, AuthenticatedUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Register a new user (customer self-registration or admin-created).
   */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * GET /api/auth/profile
   * Get the authenticated user's profile.
   */
  @UseGuards(FirebaseAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserProfile(user.firebaseUid);
  }

  /**
   * POST /api/auth/verify
   * Verify the current token and return user data.
   */
  @UseGuards(FirebaseAuthGuard)
  @Post('verify')
  async verify(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserProfile(user.firebaseUid);
  }
}
