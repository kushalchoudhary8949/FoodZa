import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type UserCredential,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCy-EQZ49AdL0aPjp9ydBY1nGWSAu1t2Ec",
  authDomain: "foodza-6e992.firebaseapp.com",
  projectId: "foodza-6e992",
  storageBucket: "foodza-6e992.firebasestorage.app",
  messagingSenderId: "190010693093",
  appId: "1:190010693093:web:9690f27c2d67b184c10b0c",
  measurementId: "G-E4LP6PXCNC",
};

// Initialize Firebase App (prevent re-initializing if already initialized)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely (only supported in browser environments)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported or blocked in this environment
    });
}

// Initialize Auth
export const auth = getAuth(app);

/**
 * Normalizes phone numbers to standard E.164 format (e.g. +919876543210)
 * which is strictly required by Firebase Phone Authentication.
 */
export const formatPhoneNumber = (phone: string, defaultCountryCode: string = "+91"): string => {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  // If user entered 10 digits without country code (standard Indian number)
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  return `${defaultCountryCode}${cleaned.replace(/^0+/, "")}`;
};

/**
 * Sets up and renders an invisible or visible reCAPTCHA verifier for OTP requests.
 * Uses window.recaptchaVerifier cache to prevent duplicate element errors.
 */
export const setupRecaptcha = (
  containerId: string = "recaptcha-container",
  size: "invisible" | "normal" = "invisible"
): RecaptchaVerifier => {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA can only be initialized in the browser.");
  }

  // Clear existing verifier if any to avoid DOM widget conflicts
  const windowAny = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
  if (windowAny.recaptchaVerifier) {
    try {
      windowAny.recaptchaVerifier.clear();
    } catch {
      // Ignore if already destroyed
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. Please request OTP again.");
    },
  });

  windowAny.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Triggers Firebase to send an SMS OTP to the recipient's phone number.
 */
export const sendOtp = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  return await signInWithPhoneNumber(auth, formattedPhone, verifier);
};

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  firebaseSignOut,
  type ConfirmationResult,
  type UserCredential,
};

export default app;
