import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, SupabaseSyncDto } from './dto/auth.dto';
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
   * POST /api/auth/supabase/sync
   * Sync a Supabase Auth user profile to the local database.
   */
  @Public()
  @Post('supabase/sync')
  async syncSupabase(@Body() dto: SupabaseSyncDto) {
    return this.authService.syncSupabaseUser(dto);
  }

  /**
   * GET /api/auth/profile
   * Get the authenticated user's profile.
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserProfile(user.id);
  }

  /**
   * POST /api/auth/verify
   * Verify the current token and return user data.
   */
  @Post('verify')
  async verify(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getUserProfile(user.id);
  }
}
