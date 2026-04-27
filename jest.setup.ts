import "@testing-library/jest-native/extend-expect";

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
