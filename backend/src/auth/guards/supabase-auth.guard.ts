import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private supabaseClient: SupabaseClient | null = null;
  private firebaseInitialized = false;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initSupabase();
    this.initFirebase();
  }

  private initSupabase() {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.config.get<string>('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.logger.log(`Supabase Auth client initialized for: ${supabaseUrl}`);
    } else {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_KEY not provided — token decoding/fallback mode active',
      );
    }
  }

  private initFirebase() {
    const skipFirebase = this.config.get<string>('SKIP_FIREBASE_AUTH') === 'true';
    if (skipFirebase) return;

    if (admin.apps.length === 0) {
      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin initialized for legacy auth support');
      }
    } else {
      this.firebaseInitialized = true;
    }
  }

  private shouldSkipAuth(): boolean {
    const skipSupabase = this.config.get<string>('SKIP_AUTH') === 'true';
    const skipFirebase = this.config.get<string>('SKIP_FIREBASE_AUTH') === 'true';
    const hasSupabase = !!(
      this.config.get<string>('SUPABASE_URL') &&
      (this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
        this.config.get<string>('SUPABASE_ANON_KEY'))
    );
    const hasFirebase = !!(
      this.config.get<string>('FIREBASE_PROJECT_ID') &&
      this.config.get<string>('FIREBASE_CLIENT_EMAIL') &&
      this.config.get<string>('FIREBASE_PRIVATE_KEY')
    );

    return skipSupabase || (skipFirebase && !hasSupabase && !hasFirebase);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const skipAuth = this.shouldSkipAuth();

    let supabaseUid: string | null = null;
    let firebaseUid: string | null = null;
    let tokenEmail: string | null = null;
    let tokenName: string | null = null;
    let tokenRole: UserRole | null = null;

    // 1. Try Supabase verification if client is configured
    // Bounded with a timeout so a slow/paused Supabase project can't hang
    // the entire request (which surfaces on the client as a fetch timeout).
    if (this.supabaseClient) {
      try {
        const getUserPromise = this.supabaseClient.auth.getUser(token);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase getUser timed out after 5s')), 5000),
        );
        const { data, error } = await Promise.race([getUserPromise, timeoutPromise]);
        if (!error && data?.user) {
          supabaseUid = data.user.id;
          tokenEmail = data.user.email ?? null;
          tokenName =
            (data.user.user_metadata?.name as string) ||
            (data.user.user_metadata?.full_name as string) ||
            tokenEmail?.split('@')[0] ||
            'User';
          const metaRole = (data.user.app_metadata?.role ||
            data.user.user_metadata?.role) as string;
          if (metaRole && Object.values(UserRole).includes(metaRole as UserRole)) {
            tokenRole = metaRole as UserRole;
          }
        }
      } catch (err) {
        this.logger.debug(`Supabase getUser verification failed: ${(err as Error).message}`);
      }
    }

    // 2. If token looks like a JWT, attempt fallback inspection if not verified yet
    if (!supabaseUid && token.includes('.') && token.split('.').length === 3) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);

        // Supabase JWTs typically have 'iss' containing 'supabase' or sub formatted as uuid
        if (payload.iss?.includes('supabase') || (payload.sub && payload.aud === 'authenticated')) {
          supabaseUid = payload.sub;
          tokenEmail = payload.email ?? null;
          tokenName =
            payload.user_metadata?.name ||
            payload.user_metadata?.full_name ||
            tokenEmail?.split('@')[0] ||
            'User';
          const metaRole = (payload.app_metadata?.role || payload.user_metadata?.role) as string;
          if (metaRole && Object.values(UserRole).includes(metaRole as UserRole)) {
            tokenRole = metaRole as UserRole;
          }
        }
      } catch {
        // Not a standard JSON JWT
      }
    }

    // 3. Fallback to Firebase token verification if not matched as Supabase
    if (!supabaseUid && this.firebaseInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        tokenEmail = decodedToken.email ?? null;
        tokenName = decodedToken.name ?? tokenEmail?.split('@')[0] ?? 'User';
      } catch (err) {
        this.logger.debug(`Firebase token verification failed: ${(err as Error).message}`);
      }
    }

    // 4. Dev / mock token fallback
    if (!supabaseUid && !firebaseUid && (skipAuth || !this.supabaseClient)) {
      if (token.startsWith('sb_') || token.includes('-')) {
        supabaseUid = token;
      } else {
        firebaseUid = token;
      }
    }

    if (!supabaseUid && !firebaseUid) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // 5. Look up user in database
    let user: any = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(supabaseUid ? [{ supabaseUid }] : []),
          ...(firebaseUid ? [{ firebaseUid }] : []),
          ...(tokenEmail ? [{ email: tokenEmail }] : []),
        ],
      },
      include: {
        manager: { select: { id: true, restaurantId: true } },
        customer: { select: { id: true } },
        deliveryPartner: { select: { id: true } },
      },
    });

    // 6. Link supabaseUid if user found by email or firebaseUid but missing supabaseUid
    if (user && supabaseUid && !user.supabaseUid) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { supabaseUid },
        include: {
          manager: { select: { id: true, restaurantId: true } },
          customer: { select: { id: true } },
          deliveryPartner: { select: { id: true } },
        },
      });
      this.logger.log(`Linked user ${user.id} to Supabase UID: ${supabaseUid}`);
    }

    // 7. Auto-provision in dev mode or for new Supabase signups
    if (!user) {
      const isDevAdmin = (supabaseUid || firebaseUid || '').toLowerCase().includes('admin');
      const isDevManager =
        (supabaseUid || firebaseUid || '').toLowerCase().includes('mgr') ||
        (supabaseUid || firebaseUid || '').toLowerCase().includes('manager');
      const isDevPartner =
        (supabaseUid || firebaseUid || '').toLowerCase().includes('dp') ||
        (supabaseUid || firebaseUid || '').toLowerCase().includes('partner');

      const role: UserRole = tokenRole
        ? tokenRole
        : isDevAdmin
          ? UserRole.ADMIN
          : isDevManager
            ? UserRole.MANAGER
            : isDevPartner
              ? UserRole.DELIVERY_PARTNER
              : UserRole.CUSTOMER;

      let restaurantIdToLink: string | undefined;
      if (role === UserRole.MANAGER) {
        const idLower = (supabaseUid || firebaseUid || '').toLowerCase();
        let matchedRest = null;
        if (idLower.includes('kfc')) {
          matchedRest = await this.prisma.restaurant.findFirst({
            where: { name: { contains: 'KFC', mode: 'insensitive' } },
          });
        } else if (idLower.includes('pizza')) {
          matchedRest = await this.prisma.restaurant.findFirst({
            where: { name: { contains: 'Pizza', mode: 'insensitive' } },
          });
        } else if (idLower.includes('subway')) {
          matchedRest = await this.prisma.restaurant.findFirst({
            where: { name: { contains: 'Subway', mode: 'insensitive' } },
          });
        }
        if (!matchedRest) {
          matchedRest = await this.prisma.restaurant.findFirst({ where: { isActive: true } });
        }
        restaurantIdToLink = matchedRest?.id;
      }

      const userName = tokenName || supabaseUid || firebaseUid || 'User';
      const userEmail =
        tokenEmail || `${supabaseUid || firebaseUid}@foodza.local`;

      user = await this.prisma.user.create({
        data: {
          supabaseUid: supabaseUid ?? undefined,
          firebaseUid: firebaseUid ?? undefined,
          name: userName,
          phone: '+91 98000 00000',
          email: userEmail,
          role,
          customer:
            role === UserRole.CUSTOMER
              ? { create: { name: userName, phone: '+91 98000 00000' } }
              : undefined,
          deliveryPartner:
            role === UserRole.DELIVERY_PARTNER
              ? { create: { phone: '+91 98000 00000' } }
              : undefined,
          manager:
            role === UserRole.MANAGER && restaurantIdToLink
              ? { create: { restaurantId: restaurantIdToLink } }
              : undefined,
        },
        include: {
          manager: { select: { id: true, restaurantId: true } },
          customer: { select: { id: true } },
          deliveryPartner: { select: { id: true } },
        },
      });
      this.logger.log(`Auto-provisioned user: ${user.id} (${user.role})`);
    }

    // 8. Ensure role profiles exist
    if (user.role === UserRole.MANAGER && !user.manager) {
      const defaultRest = await this.prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRest) {
        user.manager = await this.prisma.manager.create({
          data: {
            userId: user.id,
            restaurantId: defaultRest.id,
          },
          select: { id: true, restaurantId: true },
        });
      }
    }

    if (user.role === UserRole.DELIVERY_PARTNER && !user.deliveryPartner) {
      user.deliveryPartner = await this.prisma.deliveryPartner.create({
        data: {
          userId: user.id,
          phone: user.phone ?? '+91 98000 00000',
        },
        select: { id: true },
      });
    }

    if (user.role === UserRole.CUSTOMER && !user.customer) {
      user.customer = await this.prisma.customer.create({
        data: {
          userId: user.id,
          name: user.name ?? 'Customer',
          phone: user.phone ?? '+91 98000 00000',
        },
        select: { id: true },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // 9. Build authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      supabaseUid: user.supabaseUid,
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    };

    if (user.manager) {
      authenticatedUser.managerId = user.manager.id;
      authenticatedUser.restaurantId = user.manager.restaurantId;
    }
    if (user.customer) {
      authenticatedUser.customerId = user.customer.id;
    }
    if (user.deliveryPartner) {
      authenticatedUser.deliveryPartnerId = user.deliveryPartner.id;
    }

    request.user = authenticatedUser;
    return true;
  }
}
