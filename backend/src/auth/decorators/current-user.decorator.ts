import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user from the request.
 * Populated by FirebaseAuthGuard after token verification + DB lookup.
 *
 * Usage: @CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

/**
 * The shape of the user object attached to every authenticated request.
 */
export interface AuthenticatedUser {
  id: string;
  supabaseUid?: string;
  firebaseUid?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  /** Only set for MANAGER role */
  managerId?: string;
  /** Only set for MANAGER role */
  restaurantId?: string;
  /** Only set for CUSTOMER role */
  customerId?: string;
  /** Only set for DELIVERY_PARTNER role */
  deliveryPartnerId?: string;
}
