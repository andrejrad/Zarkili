import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ClientLoyaltyScreen } from "../ClientLoyaltyScreen";
import { AdminLoyaltyScreen } from "../AdminLoyaltyScreen";
import { createLoyaltyAdminService } from "../loyaltyAdminService";
import type { CustomerLoyaltyState, LoyaltyTransaction, TenantLoyaltyConfig } from "../../../domains/loyalty/model";
import type { LoyaltyRepository } from "../../../domains/loyalty/repository";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_CONFIG: TenantLoyaltyConfig = {
  tenantId: "t1",
  enabled: true,
  pointsPerCurrencyUnit: 1,
  tiers: [
    { tierId: "bronze", name: "Bronze", minPoints: 0, maxPoints: 499, benefits: [] },
    { tierId: "silver", name: "Silver", minPoints: 500, maxPoints: 999, benefits: [] },
    { tierId: "gold", name: "Gold", minPoints: 1000, maxPoints: null, benefits: [] },
  ],
  redemptionOptions: [
    { optionId: "disc10", name: "10% Discount", pointsCost: 200, valueDescription: "10% off next booking", type: "discount" },
    { optionId: "free_cut", name: "Free Haircut", pointsCost: 1000, valueDescription: "Free haircut", type: "free_service" },
  ],
  pointsExpiryDays: null,
  createdAt: { seconds: 1000, nanoseconds: 0 } as never,
  updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
};

const MOCK_STATE: CustomerLoyaltyState = {
  userId: "user1",
  tenantId: "t1",
  points: 350,
  lifetimePoints: 350,
  currentTierId: "bronze",
  enrolledAt: { seconds: 1000, nanoseconds: 0 } as never,
  updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
};

const MOCK_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    txId: "tx1",
    userId: "user1",
    tenantId: "t1",
    type: "credit",
    points: 100,
    reason: "Completed appointment",
    referenceId: "booking1",
    idempotencyKey: "k1",
    createdAt: { seconds: 1001, nanoseconds: 0 } as never,
  },
  {
    txId: "tx2",
    userId: "user1",
    tenantId: "t1",
    type: "debit",
    points: 50,
    reason: "Redeemed: 10% Discount",
    referenceId: "disc10",
    idempotencyKey: "k2",
    createdAt: { seconds: 1002, nanoseconds: 0 } as never,
  },
];

// ---------------------------------------------------------------------------
// ClientLoyaltyScreen smoke tests
// ---------------------------------------------------------------------------

describe("ClientLoyaltyScreen", () => {
  const baseProps = {
    loyaltyState: MOCK_STATE,
    config: MOCK_CONFIG,
    transactions: MOCK_TRANSACTIONS,
    isLoading: false,
    error: null,
    onRedeem: jest.fn(),
  };

  it("renders loading indicator", () => {
    const { getByTestId } = render(
      <ClientLoyaltyScreen {...baseProps} isLoading transactions={[]} loyaltyState={null} />,
    );
    // ActivityIndicator renders without throwing
  });

  it("renders error state", () => {
    const { getByText } = render(
      <ClientLoyaltyScreen {...baseProps} error="Failed to load" transactions={[]} loyaltyState={null} />,
    );
    expect(getByText("Failed to load")).toBeTruthy();
  });

  it("renders disabled state when config is null", () => {
    const { getByText } = render(
      <ClientLoyaltyScreen {...baseProps} config={null} />,
    );
    expect(getByText(/not active/i)).toBeTruthy();
  });

  it("renders points balance for enrolled user", () => {
    const { getByText } = render(<ClientLoyaltyScreen {...baseProps} />);
    expect(getByText("350")).toBeTruthy();
  });

  it("renders current tier badge", () => {
    const { getByText } = render(<ClientLoyaltyScreen {...baseProps} />);
    expect(getByText("Bronze")).toBeTruthy();
  });

  it("renders progress toward next tier", () => {
    const { getByText } = render(<ClientLoyaltyScreen {...baseProps} />);
    expect(getByText(/silver/i)).toBeTruthy();
  });

  it("renders redemption options", () => {
    const { getByText } = render(<ClientLoyaltyScreen {...baseProps} />);
    expect(getByText("10% Discount")).toBeTruthy();
    expect(getByText("Free Haircut")).toBeTruthy();
  });

  it("shows locked label for options the user cannot afford", () => {
    const { getAllByText } = render(<ClientLoyaltyScreen {...baseProps} />);
    // Free Haircut costs 1000, user has 350 → locked
    const locked = getAllByText("Locked");
    expect(locked.length).toBeGreaterThan(0);
  });

  it("calls onRedeem with correct optionId for affordable option", () => {
    const onRedeem = jest.fn();
    const { getByLabelText } = render(
      <ClientLoyaltyScreen {...baseProps} onRedeem={onRedeem} />,
    );
    fireEvent.press(getByLabelText(/Redeem 10% Discount/i));
    expect(onRedeem).toHaveBeenCalledWith("disc10");
  });

  it("renders transaction history", () => {
    const { getByText } = render(<ClientLoyaltyScreen {...baseProps} />);
    expect(getByText("Completed appointment")).toBeTruthy();
    expect(getByText("Redeemed: 10% Discount")).toBeTruthy();
  });

  it("renders empty transaction state", () => {
    const { getByText } = render(
      <ClientLoyaltyScreen {...baseProps} transactions={[]} />,
    );
    expect(getByText(/no transactions/i)).toBeTruthy();
  });

  it("renders top-tier message when user is at gold", () => {
    const goldState = { ...MOCK_STATE, lifetimePoints: 1000, currentTierId: "gold" };
    const { getByText } = render(<ClientLoyaltyScreen {...baseProps} loyaltyState={goldState} />);
    expect(getByText(/highest tier/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AdminLoyaltyScreen smoke tests
// ---------------------------------------------------------------------------

const ADMIN_BASE_PROPS = {
  tenantId: "t1",
  config: MOCK_CONFIG,
  customerSummaries: [
    { userId: "user1", displayName: "Alice", points: 350, lifetimePoints: 350, currentTierId: "bronze" },
    { userId: "user2", displayName: "Bob", points: 50, lifetimePoints: 50, currentTierId: null },
  ],
  isLoadingOverview: false,
  overviewError: null,
  selectedUserId: null,
  onSelectUser: jest.fn(),
  selectedUserState: null,
  selectedUserTransactions: [],
  isLoadingDetail: false,
  adjustDelta: "",
  onAdjustDeltaChange: jest.fn(),
  adjustReason: "",
  onAdjustReasonChange: jest.fn(),
  onConfirmAdjust: jest.fn(),
  isAdjusting: false,
  adjustError: null,
  onRedeemOption: jest.fn(),
  isRedeeming: false,
  redeemError: null,
};

describe("AdminLoyaltyScreen", () => {
  it("renders overview loading indicator", () => {
    render(<AdminLoyaltyScreen {...ADMIN_BASE_PROPS} isLoadingOverview />);
  });

  it("renders overview error", () => {
    const { getByText } = render(
      <AdminLoyaltyScreen {...ADMIN_BASE_PROPS} overviewError="Network error" />,
    );
    expect(getByText("Network error")).toBeTruthy();
  });

  it("renders customer list", () => {
    const { getByText } = render(<AdminLoyaltyScreen {...ADMIN_BASE_PROPS} />);
    expect(getByText("Alice")).toBeTruthy();
    expect(getByText("Bob")).toBeTruthy();
  });

  it("calls onSelectUser when customer row is pressed", () => {
    const onSelectUser = jest.fn();
    const { getByLabelText } = render(
      <AdminLoyaltyScreen {...ADMIN_BASE_PROPS} onSelectUser={onSelectUser} />,
    );
    fireEvent.press(getByLabelText("Select Alice"));
    expect(onSelectUser).toHaveBeenCalledWith("user1");
  });

  it("renders customer detail when user is selected", () => {
    const { getByText } = render(
      <AdminLoyaltyScreen
        {...ADMIN_BASE_PROPS}
        selectedUserId="user1"
        selectedUserState={MOCK_STATE}
        selectedUserTransactions={MOCK_TRANSACTIONS}
      />,
    );
    expect(getByText("Adjust Points")).toBeTruthy();
  });

  it("renders redemption options in detail panel", () => {
    const { getByText } = render(
      <AdminLoyaltyScreen
        {...ADMIN_BASE_PROPS}
        selectedUserId="user1"
        selectedUserState={MOCK_STATE}
        selectedUserTransactions={[]}
      />,
    );
    expect(getByText(/10% Discount/)).toBeTruthy();
  });

  it("calls onRedeemOption when redemption pressed", () => {
    const onRedeemOption = jest.fn();
    const { getByLabelText } = render(
      <AdminLoyaltyScreen
        {...ADMIN_BASE_PROPS}
        selectedUserId="user1"
        selectedUserState={MOCK_STATE}
        selectedUserTransactions={[]}
        onRedeemOption={onRedeemOption}
      />,
    );
    fireEvent.press(getByLabelText(/Redeem 10% Discount for customer/i));
    expect(onRedeemOption).toHaveBeenCalledWith("disc10");
  });

  it("renders empty overview message when no customers", () => {
    const { getByText } = render(
      <AdminLoyaltyScreen {...ADMIN_BASE_PROPS} customerSummaries={[]} />,
    );
    expect(getByText(/no customers/i)).toBeTruthy();
  });

  it("renders transaction history in detail panel", () => {
    const { getByText } = render(
      <AdminLoyaltyScreen
        {...ADMIN_BASE_PROPS}
        selectedUserId="user1"
        selectedUserState={MOCK_STATE}
        selectedUserTransactions={MOCK_TRANSACTIONS}
      />,
    );
    expect(getByText("Completed appointment")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// loyaltyAdminService unit tests
// ---------------------------------------------------------------------------

function makeMockRepo(): LoyaltyRepository {
  const transactions: LoyaltyTransaction[] = [];
  let txCounter = 0;

  return {
    getLoyaltyConfig: jest.fn(async () => null),
    saveLoyaltyConfig: jest.fn(async () => {}),
    getCustomerLoyaltyState: jest.fn(async (userId: string) =>
      userId === "user1"
        ? ({ userId, tenantId: "t1", points: 350, lifetimePoints: 350, currentTierId: "bronze" } as never)
        : null,
    ),
    creditPoints: jest.fn(async (userId, tenantId, points, reason, referenceId, idempotencyKey) => {
      const tx: LoyaltyTransaction = {
        txId: `tx-${++txCounter}`,
        userId,
        tenantId,
        type: "credit",
        points,
        reason,
        referenceId,
        idempotencyKey,
        createdAt: { seconds: 1000, nanoseconds: 0 } as never,
      };
      transactions.push(tx);
      return tx;
    }),
    debitPoints: jest.fn(async (userId, tenantId, points, reason, referenceId, idempotencyKey) => {
      const tx: LoyaltyTransaction = {
        txId: `tx-${++txCounter}`,
        userId,
        tenantId,
        type: "debit",
        points,
        reason,
        referenceId,
        idempotencyKey,
        createdAt: { seconds: 1000, nanoseconds: 0 } as never,
      };
      transactions.push(tx);
      return tx;
    }),
    getBalance: jest.fn(async () => 350),
    listTransactions: jest.fn(async () => transactions),
  };
}

describe("loyaltyAdminService", () => {
  it("listCustomerLoyaltyOverview returns sorted summaries", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const summaries = await svc.listCustomerLoyaltyOverview("t1", ["user1", "unknownUser"], {
      user1: "Alice",
      unknownUser: "Nobody",
    });
    expect(summaries[0]!.userId).toBe("user1");
    expect(summaries[0]!.points).toBe(350);
    expect(summaries[1]!.points).toBe(0);
  });

  it("adjustPoints credits when delta is positive", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const result = await svc.adjustPoints({ tenantId: "t1", userId: "user1", delta: 100, reason: "Test", adminId: "admin1" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.transaction.type).toBe("credit");
  });

  it("adjustPoints debits when delta is negative", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const result = await svc.adjustPoints({ tenantId: "t1", userId: "user1", delta: -50, reason: "Correction", adminId: "admin1" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.transaction.type).toBe("debit");
  });

  it("adjustPoints returns error for delta zero", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const result = await svc.adjustPoints({ tenantId: "t1", userId: "user1", delta: 0, reason: "?", adminId: "admin1" });
    expect(result.ok).toBe(false);
  });

  it("redeemPointsForCustomer returns error for unknown option", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const result = await svc.redeemPointsForCustomer("t1", "user1", MOCK_CONFIG, "badoption");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("OPTION_NOT_FOUND");
  });

  it("redeemPointsForCustomer calls debitPoints with correct cost", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const result = await svc.redeemPointsForCustomer("t1", "user1", MOCK_CONFIG, "disc10");
    expect(result.ok).toBe(true);
    expect(repo.debitPoints).toHaveBeenCalledWith(
      "user1", "t1", 200, expect.any(String), "disc10", expect.any(String),
    );
  });

  it("getTopCustomers limits results", async () => {
    const repo = makeMockRepo();
    const svc = createLoyaltyAdminService(repo);
    const top = await svc.getTopCustomers("t1", ["user1", "unknownUser"], 1);
    expect(top).toHaveLength(1);
  });
});
