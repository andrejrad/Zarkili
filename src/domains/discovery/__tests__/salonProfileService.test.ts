/**
 * salonProfileService.test.ts — W38-DEBT-2
 *
 * Unit tests for createSalonProfileService / getSalonProfile.
 * Uses a mock Firestore client — no emulator required.
 */

import { createSalonProfileService } from "../salonProfileService";
import type { Firestore } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Minimal Firestore mock helpers
// ---------------------------------------------------------------------------

function makeTimestamp(isoDate: string) {
  const date = new Date(isoDate);
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  };
}

function makeDocSnap(exists: boolean, data: Record<string, unknown> = {}) {
  return { exists: () => exists, data: () => data, id: "doc-id" };
}

function makeQuerySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
}

function makeDb(options: {
  tenantDoc?: Record<string, unknown> | null;
  services?: Array<{ id: string; data: Record<string, unknown> }>;
  staff?: Array<{ id: string; data: Record<string, unknown> }>;
  reviews?: Array<{ id: string; data: Record<string, unknown> }>;
  media?: Array<{ id: string; data: Record<string, unknown> }>;
  getDocThrows?: boolean;
}): Firestore {
  const { tenantDoc = null, services = [], staff = [], reviews = [] } = options;

  let callCount = 0;
  const collections: Record<string, typeof services> = {
    services,
    staff,
    reviews,
  };

  const mockGetDoc = jest.fn(async () => {
    if (options.getDocThrows) throw new Error("Network error");
    if (tenantDoc === null) return makeDocSnap(false);
    return makeDocSnap(true, tenantDoc);
  });

  const mockGetDocs = jest.fn(async (q: unknown) => {
    // Return subcollection data based on the collection path stored on the query object
    const path: string = (q as { _path?: string })._path ?? "";
    if (path.includes("services")) return makeQuerySnap(collections.services);
    if (path.includes("staff")) return makeQuerySnap(collections.staff);
    if (path.includes("reviews")) return makeQuerySnap(collections.reviews);
    return makeQuerySnap([]);
  });

  // Fluent builder mocks so collection/doc/query/where/orderBy/limit chains work
  const buildableQuery = (path: string) => {
    const obj: Record<string, unknown> = { _path: path };
    obj.where = () => obj;
    obj.orderBy = () => obj;
    obj.limit = () => obj;
    return obj;
  };

  const mockCollection = jest.fn((db: unknown, path: string) => buildableQuery(path));
  const mockDoc = jest.fn((_db: unknown, _col: string, _id: string) => ({ _isDoc: true }));
  const mockQuery = jest.fn((col: unknown) => col);
  const mockWhere = jest.fn((col: unknown) => col);
  const mockOrderBy = jest.fn((col: unknown) => col);
  const mockLimit = jest.fn((col: unknown) => col);

  // Patch the firebase/firestore module functions via the service's internal calls
  // (the service imports these at module level, so we mock the module)
  return { _mockGetDoc: mockGetDoc, _mockGetDocs: mockGetDocs, _mockCollection: mockCollection } as unknown as Firestore;
}

// ---------------------------------------------------------------------------
// Because the service imports firebase/firestore functions directly (not injected),
// we must use jest.mock to intercept them.
// ---------------------------------------------------------------------------

jest.mock("firebase/firestore", () => {
  const actual = jest.requireActual<typeof import("firebase/firestore")>("firebase/firestore");
  return {
    ...actual,
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn((_db, col, id) => ({ _path: `${col}/${id}` })),
    collection: jest.fn((_db, path) => {
      const buildable = { _path: path } as Record<string, unknown>;
      return buildable;
    }),
    query: jest.fn((col) => col),
    where: jest.fn((col) => col),
    orderBy: jest.fn((col) => col),
    limit: jest.fn((col) => col),
  };
});

import { getDoc, getDocs } from "firebase/firestore";
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT_DOC = {
  brandName: "Luxe Hair Studio",
  tagline: "Color & care, elevated",
  city: "London",
  addressLine1: "12 Oxford St, London",
  rating: 4.9,
  reviewCount: 87,
  description: "A boutique salon offering balayage and glossing services.",
};

const SERVICES = [
  { id: "svc-1", data: { name: "Balayage", durationMinutes: 150, priceCents: 25000, active: true, sortOrder: 1 } },
  { id: "svc-2", data: { name: "Gloss", durationMinutes: 45, priceCents: 7500, active: true, sortOrder: 2 } },
];

const STAFF = [
  { id: "staff-1", data: { displayName: "Ana Costa", role: "Senior stylist", status: "active", rating: 4.9, bio: "10 years of color." } },
];

const REVIEWS = [
  { id: "rev-1", data: { authorName: "Jordan", rating: 5, text: "Amazing!", createdAt: "Apr 22" } },
  { id: "rev-2", data: { authorName: "Riley", rating: 4, text: "Great service.", createdAt: makeTimestamp("2025-04-18") } },
];

const FAKE_DB = {} as Firestore;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => jest.clearAllMocks());

describe("getSalonProfile — success path", () => {
  it("returns ok with salon data from tenant document", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, TENANT_DOC) as never);
    mockGetDocs.mockResolvedValue(makeQuerySnap([]) as never);

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("tenant-abc");

    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.salon.name).toBe("Luxe Hair Studio");
    expect(result.data.salon.tagline).toBe("Color & care, elevated");
    expect(result.data.salon.city).toBe("London");
    expect(result.data.salon.rating).toBe(4.9);
    expect(result.data.salon.reviewCount).toBe(87);
    expect(result.data.salon.id).toBe("tenant-abc");
  });

  it("maps services sub-collection to SalonServiceSummary[]", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, TENANT_DOC) as never);
    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnap(SERVICES) as never) // services
      .mockResolvedValueOnce(makeQuerySnap([]) as never)       // staff
      .mockResolvedValueOnce(makeQuerySnap([]) as never);      // reviews

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("tenant-abc");

    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.services).toHaveLength(2);
    expect(result.data.services[0]).toMatchObject({ id: "svc-1", name: "Balayage", durationMinutes: 150, priceCents: 25000 });
  });

  it("maps staff sub-collection to SalonStaffSummary[]", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, TENANT_DOC) as never);
    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnap([]) as never)       // services
      .mockResolvedValueOnce(makeQuerySnap(STAFF) as never)    // staff
      .mockResolvedValueOnce(makeQuerySnap([]) as never);      // reviews

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("tenant-abc");

    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.staff).toHaveLength(1);
    expect(result.data.staff[0]).toMatchObject({ id: "staff-1", name: "Ana Costa", role: "Senior stylist", bio: "10 years of color." });
  });

  it("maps reviews sub-collection including Timestamp createdAt", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, TENANT_DOC) as never);
    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnap([]) as never)
      .mockResolvedValueOnce(makeQuerySnap([]) as never)
      .mockResolvedValueOnce(makeQuerySnap(REVIEWS) as never);

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("tenant-abc");

    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.reviews).toHaveLength(2);
    expect(result.data.reviews[0]).toMatchObject({ id: "rev-1", authorName: "Jordan", rating: 5 });
    // Second review has Timestamp — should be formatted as a date string
    expect(typeof result.data.reviews[1].postedAt).toBe("string");
    expect(result.data.reviews[1].postedAt.length).toBeGreaterThan(0);
  });
});

describe("getSalonProfile — not found path", () => {
  it("returns not_found when tenant document does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(false) as never);

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("unknown-tenant");

    expect(result.type).toBe("not_found");
  });
});

describe("getSalonProfile — error path", () => {
  it("returns error when getDoc throws", async () => {
    mockGetDoc.mockRejectedValueOnce(new Error("Firestore unavailable"));

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("tenant-abc");

    expect(result.type).toBe("error");
    if (result.type !== "error") return;
    expect(result.message).toContain("Firestore unavailable");
  });

  it("returns ok with empty arrays when subcollection getDocs throws", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, TENANT_DOC) as never);
    mockGetDocs.mockRejectedValue(new Error("Permission denied"));

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("tenant-abc");

    // Profile loads, subcollections fail gracefully
    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.services).toEqual([]);
    expect(result.data.staff).toEqual([]);
    expect(result.data.reviews).toEqual([]);
  });
});

describe("getSalonProfile — fallback field names", () => {
  it("uses legalName when brandName is absent", async () => {
    const doc = { legalName: "Legal Salon LLC", city: "Paris", addressLine1: "1 Rue de la Paix" };
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, doc) as never);
    mockGetDocs.mockResolvedValue(makeQuerySnap([]) as never);

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("t1");

    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.salon.name).toBe("Legal Salon LLC");
  });

  it("uses displayName for staff when name field is absent", async () => {
    mockGetDoc.mockResolvedValueOnce(makeDocSnap(true, TENANT_DOC) as never);
    const staffWithDisplayName = [
      { id: "s1", data: { displayName: "Cara Bloom", role: "Colorist", status: "active" } },
    ];
    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnap([]) as never)
      .mockResolvedValueOnce(makeQuerySnap(staffWithDisplayName) as never)
      .mockResolvedValueOnce(makeQuerySnap([]) as never);

    const service = createSalonProfileService(FAKE_DB);
    const result = await service.getSalonProfile("t2");

    expect(result.type).toBe("ok");
    if (result.type !== "ok") return;
    expect(result.data.staff[0].name).toBe("Cara Bloom");
  });
});
