import "@testing-library/jest-native/extend-expect";

// ---------------------------------------------------------------------------
// Global Firebase mocks — prevent ESM parse errors in tests that don't
// explicitly mock Firebase themselves. Per-test jest.mock() calls override
// these because they are hoisted and run after setupFilesAfterEnach.
// ---------------------------------------------------------------------------
jest.mock("firebase/app", () => ({
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  sendEmailVerification: jest.fn(async () => undefined),
  createUserWithEmailAndPassword: jest.fn(async () => ({ user: { uid: "uid" } })),
  signInWithEmailAndPassword: jest.fn(async () => ({ user: { uid: "uid" } })),
  signInAnonymously: jest.fn(async () => ({ user: { uid: "anon-uid" } })),
  signOut: jest.fn(async () => undefined),
  sendPasswordResetEmail: jest.fn(async () => undefined),
  updateEmail: jest.fn(async () => undefined),
  onAuthStateChanged: jest.fn(() => () => undefined),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn((_db: unknown, name: string) => ({ name })),
  doc: jest.fn((_db: unknown, ...args: string[]) => ({ path: args.join("/") })),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => undefined })),
  getDocs: jest.fn(async () => ({ docs: [], forEach: jest.fn() })),
  setDoc: jest.fn(async () => undefined),
  addDoc: jest.fn(async () => ({ id: "mock-id" })),
  updateDoc: jest.fn(async () => undefined),
  deleteDoc: jest.fn(async () => undefined),
  query: jest.fn((...args: unknown[]) => args[0]),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  orderBy: jest.fn((field: string) => ({ field })),
  limit: jest.fn((n: number) => ({ n })),
  Timestamp: { now: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })), fromDate: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })) },
  serverTimestamp: jest.fn(() => ({ type: "serverTimestamp" })),
  writeBatch: jest.fn(() => ({ set: jest.fn(), update: jest.fn(), delete: jest.fn(), commit: jest.fn(async () => undefined) })),
  runTransaction: jest.fn(async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) => fn({ get: jest.fn(), set: jest.fn(), update: jest.fn() })),
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn(async () => ({ data: {} }))),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(async () => ({})),
  getDownloadURL: jest.fn(async () => "https://example.com/mock-url"),
}));

// Mock the firebase config module so tests that don't mock firebase themselves
// don't crash on missing EXPO_PUBLIC_FIREBASE_* env vars.
jest.mock("./src/shared/config/firebase", () => ({
  firebaseApp: {},
  auth: { currentUser: null },
  db: {},
  functions: {},
  storage: {},
}));

jest.mock("@react-native-async-storage/async-storage", () =>
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-safe-area-context", () => {
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  const frame = { x: 0, y: 0, width: 375, height: 812 };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaConsumer: ({ children }: { children: (v: typeof insets) => React.ReactNode }) => children(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});

// ---------------------------------------------------------------------------
// react-native-maps mock — MapView and Marker render as plain Views in tests.
// Real native map rendering requires an EAS dev build.
// ---------------------------------------------------------------------------
jest.mock("react-native-maps", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  const MapView = React.forwardRef(
    ({ children, testID, ...rest }: { children?: React.ReactNode; testID?: string; [k: string]: unknown }, ref: React.Ref<unknown>) =>
      React.createElement(View, { ref, testID, ...rest }, children),
  );
  const Marker = ({ testID, ...rest }: { testID?: string; [k: string]: unknown }) =>
    React.createElement(View, { testID, ...rest });
  return { __esModule: true, default: MapView, MapView, Marker, PROVIDER_GOOGLE: "google" };
});

jest.mock("@stripe/stripe-react-native", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const passthrough = ({ children }: { children?: React.ReactNode }) => children ?? null;
  return {
    StripeProvider: passthrough,
    CardField: () => null,
    ApplePayButton: () => null,
    GooglePayButton: () => null,
    AddToWalletButton: () => null,
    useStripe: () => ({
      initPaymentSheet: jest.fn(async () => ({ error: undefined })),
      presentPaymentSheet: jest.fn(async () => ({ error: undefined, paymentOption: undefined })),
      confirmPayment: jest.fn(async () => ({ error: undefined, paymentIntent: { id: "pi_test", status: "Succeeded" } })),
      createPaymentMethod: jest.fn(async () => ({ error: undefined, paymentMethod: { id: "pm_test" } })),
      handleNextAction: jest.fn(async () => ({ error: undefined })),
    }),
    useApplePay: () => ({
      isApplePaySupported: true,
      presentApplePay: jest.fn(async () => ({ error: undefined })),
      confirmApplePayPayment: jest.fn(async () => ({ error: undefined })),
    }),
    useConfirmPayment: () => ({
      confirmPayment: jest.fn(async () => ({ error: undefined, paymentIntent: { id: "pi_test", status: "Succeeded" } })),
      loading: false,
    }),
    initStripe: jest.fn(async () => undefined),
    isApplePaySupported: jest.fn(async () => true),
  };
});
