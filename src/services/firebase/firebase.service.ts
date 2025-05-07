/**
 * Firebase Service
 * 
 * This file is responsible for initializing and exporting Firebase services.
 * Following the Single Responsibility Principle, this file only handles
 * Firebase initialization and configuration.
 * 
 * For development purposes, when no Firebase credentials are available,
 * it provides mock Firebase functionality.
 */
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence, 
  setPersistence,
  Auth,
  connectAuthEmulator,
  User,
  signInWithPopup,
  NextOrObserver,
  IdTokenResult
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

// Debug configuration
const DEBUG = process.env.NODE_ENV === 'development';
const logDebug = (...args: any[]) => {
  if (DEBUG) {
    console.log('[Firebase Service]', ...args);
  }
};

// Check if code is running in browser
const isBrowser = typeof window !== 'undefined';

// PRODUCTION CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAJiH8amOaaeIP4JVrxW1i3tVcTMj8iW5o",
  authDomain: "subtracker-b2643.firebaseapp.com",
  projectId: "subtracker-b2643",
  storageBucket: "subtracker-b2643.firebasestorage.app",
  messagingSenderId: "542927848015",
  appId: "1:542927848015:web:e128a81bfd1b53389da03a"
};

logDebug('Initializing Firebase service', { 
  isBrowser, 
  environment: process.env.NODE_ENV,
  usingProductionConfig: true
});

// Create mock implementations that don't crash
const createMockAuth = (): Auth => {
  const mockUser: User = {
    uid: 'mock-user-id',
    email: 'demo@example.com',
    displayName: 'Demo User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    phoneNumber: null,
    photoURL: null,
    providerData: [],
    providerId: 'firebase',
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: async () => Promise.resolve(),
    getIdToken: async () => 'mock-id-token',
    getIdTokenResult: async () => ({
      token: 'mock-id-token',
      signInProvider: 'google.com',
      claims: {},
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      authTime: new Date().toISOString(),
      signInSecondFactor: null
    } as IdTokenResult),
    reload: async () => Promise.resolve(),
    toJSON: () => ({})
  } as User;

  return {
    currentUser: DEBUG ? mockUser : null,
    onAuthStateChanged: (callback: NextOrObserver<User>) => {
      // Call with the mock user in development for testing
      if (DEBUG && typeof callback === 'function') setTimeout(() => callback(mockUser), 100);
      return () => {}; // Return unsubscribe function
    },
    signInWithPopup: async () => ({
      user: mockUser,
      providerId: 'google.com',
      operationType: 'signIn'
    }),
    signOut: async () => Promise.resolve(),
    setPersistence: async () => Promise.resolve(),
    // Add other methods as needed
  } as unknown as Auth;
};

// Default empty implementations
const noop = () => () => {};
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

// Initialize the services
try {
  if (isBrowser) {
    logDebug('Initializing Firebase in browser');
    
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    
    // Set browser persistence
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
    
    // Only use emulators in development mode when specifically requested
    if (DEBUG && process.env.USE_FIREBASE_EMULATOR === 'true') {
      logDebug('Using Firebase emulators for development');
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (emulatorError) {
        console.error('Error connecting to Firebase emulators:', emulatorError);
      }
    }
  } else {
    logDebug('Creating server-side Firebase instance');
    // Server-side Firebase initialization
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // If initialization fails, create fallback objects
  app = {} as FirebaseApp;
  auth = createMockAuth();
  db = {} as Firestore;
  googleProvider = new GoogleAuthProvider();
}

logDebug('Firebase initialization complete');

export { auth, googleProvider, db };
export default app; 