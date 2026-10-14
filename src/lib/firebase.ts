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

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

// Initialize Auth
export const auth = getAuth(app);

export const formatPhoneNumber = (phone: string, defaultCountryCode: string = "+91"): string => {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  return `${defaultCountryCode}${cleaned.replace(/^0+/, "")}`;
};

export const setupRecaptcha = (
  containerId: string = "recaptcha-container",
  size: "invisible" | "normal" = "invisible"
): RecaptchaVerifier => {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA can only be initialized in the browser.");
  }

  const windowAny = window as unknown as { recaptchaVerifier?: RecaptchaVerifier };
  if (windowAny.recaptchaVerifier) {
    try {
      windowAny.recaptchaVerifier.clear();
    } catch {}
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size,
    callback: () => {},
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. Please request OTP again.");
    },
  });

  windowAny.recaptchaVerifier = verifier;
  return verifier;
};

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
