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
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);
  private firebaseInitialized = false;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.initFirebase();
  }

  private shouldSkipFirebase(): boolean {
    const envVal = this.config.get<string>('SKIP_FIREBASE_AUTH');
    const hasKeys = !!(
      this.config.get<string>('FIREBASE_PROJECT_ID') &&
      this.config.get<string>('FIREBASE_CLIENT_EMAIL') &&
      this.config.get<string>('FIREBASE_PRIVATE_KEY')
    );
    return envVal === 'true' || !hasKeys;
  }

  private initFirebase() {
    if (this.shouldSkipFirebase()) {
      this.logger.warn('Firebase Auth SKIPPED — dev mode active');
      return;
    }

    if (admin.apps.length === 0) {
      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin initialized');
      } else {
        this.logger.warn('Firebase credentials missing — falling back to dev mode');
      }
    } else {
      this.firebaseInitialized = true;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check @Public() decorator
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

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const skipFirebase = this.shouldSkipFirebase();

    let firebaseUid: string;

    if (skipFirebase) {
      // Dev mode: treat the token as the firebaseUid directly
      firebaseUid = token;
    } else {
      if (!this.firebaseInitialized) {
        // Fallback to treat token as uid if firebase not initialized
        firebaseUid = token;
      } else {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          firebaseUid = decodedToken.uid;
        } catch (error) {
          this.logger.warn(`Firebase token verification failed: ${(error as Error).message}`);
          throw new UnauthorizedException('Invalid or expired token');
        }
      }
    }

    // Look up user in database
    let user: any = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        manager: { select: { id: true, restaurantId: true } },
        customer: { select: { id: true } },
        deliveryPartner: { select: { id: true } },
      },
    });

    // In dev mode with skipFirebase, auto-provision user if missing
    if (!user && skipFirebase) {
      this.logger.log(`Dev Mode: Auto-provisioning missing user for firebaseUid: ${firebaseUid}`);
      const isDevAdmin = firebaseUid.includes('admin') || firebaseUid.includes('ADMIN');
      const isDevManager = firebaseUid.includes('mgr') || firebaseUid.includes('manager') || firebaseUid.includes('MGR');
      const isDevPartner = firebaseUid.includes('dp') || firebaseUid.includes('partner') || firebaseUid.includes('DP');

      const role: UserRole = isDevAdmin ? UserRole.ADMIN : isDevManager ? UserRole.MANAGER : isDevPartner ? UserRole.DELIVERY_PARTNER : UserRole.CUSTOMER;

      // If manager, resolve appropriate restaurant
      let restaurantIdToLink: string | undefined;
      if (isDevManager) {
        let matchedRest = null;
        if (firebaseUid.toLowerCase().includes('kfc')) {
          matchedRest = await this.prisma.restaurant.findFirst({ where: { name: { contains: 'KFC', mode: 'insensitive' } } });
        } else if (firebaseUid.toLowerCase().includes('pizza')) {
          matchedRest = await this.prisma.restaurant.findFirst({ where: { name: { contains: 'Pizza', mode: 'insensitive' } } });
        } else if (firebaseUid.toLowerCase().includes('subway')) {
          matchedRest = await this.prisma.restaurant.findFirst({ where: { name: { contains: 'Subway', mode: 'insensitive' } } });
        }
        if (!matchedRest) {
          matchedRest = await this.prisma.restaurant.findFirst({ where: { isActive: true } });
        }
        restaurantIdToLink = matchedRest?.id;
      }

      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          name: `${firebaseUid}`,
          phone: '+91 98000 00000',
          email: `${firebaseUid}@foodconnect.local`,
          role,
          customer: role === UserRole.CUSTOMER ? { create: { name: firebaseUid, phone: '+91 98000 00000' } } : undefined,
          deliveryPartner: role === UserRole.DELIVERY_PARTNER ? { create: { phone: '+91 98000 00000' } } : undefined,
          manager: (role === UserRole.MANAGER && restaurantIdToLink) ? { create: { restaurantId: restaurantIdToLink } } : undefined,
        },
        include: {
          manager: { select: { id: true, restaurantId: true } },
          customer: { select: { id: true } },
          deliveryPartner: { select: { id: true } },
        },
      });
    }

    // If user exists as MANAGER but has no Manager record attached, link them now
    if (user && user.role === UserRole.MANAGER && !user.manager) {
      const defaultRest = await this.prisma.restaurant.findFirst({ where: { isActive: true } });
      if (defaultRest) {
        const mgr = await this.prisma.manager.create({
          data: {
            userId: user.id,
            restaurantId: defaultRest.id,
          },
          select: { id: true, restaurantId: true },
        });
        user.manager = mgr;
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found in database');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Build authenticated user object
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    };

    // Attach role-specific IDs
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
