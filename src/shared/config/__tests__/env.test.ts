const ORIGINAL_ENV = process.env;

const REQUIRED_KEYS = {
  EXPO_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: "test-project",
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  EXPO_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:test"
};

function loadEnvModule() {
  let loaded: { env: unknown } | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("../env") as { env: unknown };
  });

  return loaded!;
}

describe("shared config env", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws clear error when required firebase key is missing", () => {
    process.env = {
      ...process.env,
      ...REQUIRED_KEYS
    };
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "";

    expect(() => loadEnvModule()).toThrow(
      "Missing required environment variable: EXPO_PUBLIC_FIREBASE_API_KEY"
    );
  });

  it("parses firebase config values from environment", () => {
    process.env = {
      ...process.env,
      ...REQUIRED_KEYS,
      EXPO_PUBLIC_APP_VARIANT: "development"
    };

    const { env } = loadEnvModule() as {
      env: {
        appVariant: "development" | "production";
        firebase: {
          apiKey: string;
          authDomain: string;
          projectId: string;
          storageBucket: string;
          messagingSenderId: string;
          appId: string;
        };
      };
    };

    expect(env.firebase).toEqual({
      apiKey: REQUIRED_KEYS.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: REQUIRED_KEYS.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: REQUIRED_KEYS.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: REQUIRED_KEYS.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: REQUIRED_KEYS.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: REQUIRED_KEYS.EXPO_PUBLIC_FIREBASE_APP_ID
    });
  });

  it("sets appVariant to production only when explicitly configured", () => {
    process.env = {
      ...process.env,
      ...REQUIRED_KEYS,
      EXPO_PUBLIC_APP_VARIANT: "production"
    };

    const production = loadEnvModule() as { env: { appVariant: string } };
    expect(production.env.appVariant).toBe("production");

    process.env = {
      ...process.env,
      ...REQUIRED_KEYS,
      EXPO_PUBLIC_APP_VARIANT: "staging"
    };

    const fallback = loadEnvModule() as { env: { appVariant: string } };
    expect(fallback.env.appVariant).toBe("development");
  });
});
