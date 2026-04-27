import { createReviewRepository } from "../repository";
import { calculateAverageRating, canModerate } from "../model";
import type { CreateReviewInput } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(_existing: unknown, newVal: unknown): unknown {
    if (newVal !== null && typeof newVal === "object" && "_type" in (newVal as Record<string, unknown>)) {
      const typed = newVal as { _type: string };
      if (typed._type === "serverTimestamp") {
        return { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
      }
    }
    return newVal;
  }

  let docIdCounter = 0;

  function doc(dbOrColRef: unknown, colOrId?: string, docId?: string) {
    if (
      typeof dbOrColRef === "object" &&
      dbOrColRef !== null &&
      "_path" in (dbOrColRef as Record<string, unknown>)
    ) {
      const colPath = (dbOrColRef as { _path: string })._path;
      const realId = colOrId ?? `gen-${++docIdCounter}`;
      const key = `${colPath}/${realId}`;
      return { _key: key, _path: colPath, id: realId };
    }
    const realId = docId ?? `gen-${++docIdCounter}`;
    const key = `${colOrId}/${realId}`;
    return { _key: key, _path: colOrId as string, id: realId };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => (data !== undefined ? { ...data } : null),
      id: ref.id,
    };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      resolved[k] = resolveValue(undefined, v);
    }
    store[ref._key] = resolved;
  }

  async function updateDoc(ref: { _key: string }, updates: Record<string, unknown>) {
    const existing = store[ref._key] ?? {};
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      resolved[k] = resolveValue(existing[k], v);
    }
    store[ref._key] = { ...existing, ...resolved };
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };
  type OrderByClause = { _orderByField: string; _dir: string };

  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  function orderBy(field: string, dir = "asc"): OrderByClause {
    return { _orderByField: field, _dir: dir };
  }

  type QueryRef = {
    _path: string;
    _wheres: WhereClause[];
    _orderBy: OrderByClause | null;
  };

  function query(colRef: { _path: string }, ...clauses: unknown[]): QueryRef {
    const wheres: WhereClause[] = [];
    let orderByClause: OrderByClause | null = null;
    for (const c of clauses) {
      const clause = c as Record<string, unknown>;
      if ("_field" in clause) wheres.push(clause as WhereClause);
      if ("_orderByField" in clause) orderByClause = clause as OrderByClause;
    }
    return { _path: colRef._path, _wheres: wheres, _orderBy: orderByClause };
  }

  function applyWhere(data: Record<string, unknown>, clause: WhereClause): boolean {
    const val = data[clause._field];
    if (clause._op === "==") return val === clause._value;
    if (clause._op === ">=") return (val as number) >= (clause._value as number);
    if (clause._op === "<=") return (val as number) <= (clause._value as number);
    if (clause._op === "in") return (clause._value as unknown[]).includes(val);
    return false;
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    let matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }))
      .filter(({ data }) => q._wheres.every((w) => applyWhere(data, w)));

    if (q._orderBy) {
      const { _orderByField, _dir } = q._orderBy;
      matches = matches.sort((a, b) => {
        const av = a.data[_orderByField] as { seconds: number } | number;
        const bv = b.data[_orderByField] as { seconds: number } | number;
        const an = typeof av === "object" && av !== null ? (av as { seconds: number }).seconds : (av as number);
        const bn = typeof bv === "object" && bv !== null ? (bv as { seconds: number }).seconds : (bv as number);
        return _dir === "desc" ? bn - an : an - bn;
      });
    }

    return {
      docs: matches.map(({ key, data }) => ({
        data: () => ({ ...data }),
        id: key.split("/").pop()!,
        exists: () => true,
      })),
      empty: matches.length === 0,
    };
  }

  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }

  return { db: {} as unknown, doc, getDoc, setDoc, updateDoc, collection, where, orderBy, query, getDocs, serverTimestamp };
}

// Module-level mock captured by jest.mock factory
let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:             (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc:          (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc:          (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  updateDoc:       (...args: unknown[]) => mock.updateDoc(...(args as Parameters<typeof mock.updateDoc>)),
  collection:      (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where:           (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  orderBy:         (...args: unknown[]) => mock.orderBy(...(args as Parameters<typeof mock.orderBy>)),
  query:           (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs:         (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

function makeRepo() { return createReviewRepository(mock.db as never); }

const COMPLETED_BOOKING = { status: "completed", customerId: "customer-1" };
const PENDING_BOOKING   = { status: "pending",   customerId: "customer-1" };
const OTHER_BOOKING     = { status: "completed", customerId: "customer-OTHER" };

function baseInput(overrides: Partial<CreateReviewInput> = {}): CreateReviewInput {
  return { tenantId: "tenant-1", locationId: "loc-1", staffId: "staff-1", bookingId: "booking-1", customerId: "customer-1", rating: 5, ...overrides };
}

// ---------------------------------------------------------------------------
// model helpers
// ---------------------------------------------------------------------------

describe("calculateAverageRating", () => {
  it("returns 0/0 for empty list",            () => expect(calculateAverageRating([])).toEqual({ averageRating: 0, reviewCount: 0 }));
  it("single rating",                         () => expect(calculateAverageRating([4])).toEqual({ averageRating: 4, reviewCount: 1 }));
  it("rounds to 1 decimal",                   () => expect(calculateAverageRating([4, 4, 5])).toEqual({ averageRating: 4.3, reviewCount: 3 }));
  it("exact integer average",                 () => expect(calculateAverageRating([4, 5, 3])).toEqual({ averageRating: 4, reviewCount: 3 }));
});

describe("canModerate", () => {
  it("pending → published",                   () => expect(canModerate("pending_moderation", "published")).toBe(true));
  it("pending → hidden",                      () => expect(canModerate("pending_moderation", "hidden")).toBe(true));
  it("pending → rejected",                    () => expect(canModerate("pending_moderation", "rejected")).toBe(true));
  it("published → hidden",                    () => expect(canModerate("published", "hidden")).toBe(true));
  it("published → pending disallowed",        () => expect(canModerate("published", "pending_moderation")).toBe(false));
  it("rejected → hidden disallowed",          () => expect(canModerate("rejected", "hidden")).toBe(false));
  it("rejected → published allowed",          () => expect(canModerate("rejected", "published")).toBe(true));
});

// ---------------------------------------------------------------------------
// createReview
// ---------------------------------------------------------------------------

describe("createReviewRepository — createReview", () => {
  it("creates review with status pending_moderation", async () => {
    const review = await makeRepo().createReview(baseInput(), COMPLETED_BOOKING);
    expect(review.status).toBe("pending_moderation");
    expect(review.reviewId).toBeTruthy();
  });

  it("stores all input fields", async () => {
    const review = await makeRepo().createReview(baseInput({ rating: 4, comment: "Great" }), COMPLETED_BOOKING);
    expect(review.rating).toBe(4);
    expect(review.comment).toBe("Great");
    expect(review.tenantId).toBe("tenant-1");
    expect(review.staffId).toBe("staff-1");
  });

  it("stores null comment when omitted", async () => {
    const review = await makeRepo().createReview(baseInput(), COMPLETED_BOOKING);
    expect(review.comment).toBeNull();
  });

  it("throws NOT_ELIGIBLE when booking not completed", async () => {
    await expect(makeRepo().createReview(baseInput(), PENDING_BOOKING)).rejects.toThrow("NOT_ELIGIBLE");
  });

  it("throws NOT_ELIGIBLE when booking belongs to different customer", async () => {
    await expect(makeRepo().createReview(baseInput(), OTHER_BOOKING)).rejects.toThrow("NOT_ELIGIBLE");
  });

  it("throws ALREADY_REVIEWED on duplicate booking submission", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput(), COMPLETED_BOOKING);
    await expect(repo.createReview(baseInput(), COMPLETED_BOOKING)).rejects.toThrow("ALREADY_REVIEWED");
  });

  it("throws INVALID_RATING for 0",   async () => { await expect(makeRepo().createReview(baseInput({ rating: 0 }), COMPLETED_BOOKING)).rejects.toThrow("INVALID_RATING"); });
  it("throws INVALID_RATING for 6",   async () => { await expect(makeRepo().createReview(baseInput({ rating: 6 }), COMPLETED_BOOKING)).rejects.toThrow("INVALID_RATING"); });
  it("throws INVALID_RATING for 3.5", async () => { await expect(makeRepo().createReview(baseInput({ rating: 3.5 }), COMPLETED_BOOKING)).rejects.toThrow("INVALID_RATING"); });

  it("initialises moderation fields to null", async () => {
    const review = await makeRepo().createReview(baseInput(), COMPLETED_BOOKING);
    expect(review.moderatedBy).toBeNull();
    expect(review.moderatedAt).toBeNull();
    expect(review.moderationReason).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getBookingReview
// ---------------------------------------------------------------------------

describe("createReviewRepository — getBookingReview", () => {
  it("returns null for unknown booking", async () => {
    expect(await makeRepo().getBookingReview("tenant-1", "no-booking")).toBeNull();
  });

  it("returns review for known booking", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput(), COMPLETED_BOOKING);
    expect((await repo.getBookingReview("tenant-1", "booking-1"))?.bookingId).toBe("booking-1");
  });
});

// ---------------------------------------------------------------------------
// listStaffReviews
// ---------------------------------------------------------------------------

describe("createReviewRepository — listStaffReviews", () => {
  it("returns empty array when no reviews", async () => {
    expect(await makeRepo().listStaffReviews("tenant-1", "staff-1")).toEqual([]);
  });

  it("does not return pending reviews under default published filter", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput({ bookingId: "b1" }), COMPLETED_BOOKING);
    expect(await repo.listStaffReviews("tenant-1", "staff-1")).toHaveLength(0);
  });

  it("returns pending_moderation reviews when asked", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput({ bookingId: "b1" }), COMPLETED_BOOKING);
    expect(await repo.listStaffReviews("tenant-1", "staff-1", "pending_moderation")).toHaveLength(1);
  });

  it("does not return reviews for a different staff", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput({ bookingId: "b1", staffId: "staff-2" }), COMPLETED_BOOKING);
    expect(await repo.listStaffReviews("tenant-1", "staff-1", "pending_moderation")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// listLocationReviews
// ---------------------------------------------------------------------------

describe("createReviewRepository — listLocationReviews", () => {
  it("returns published reviews for location after moderation", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput({ bookingId: "b1" }), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    const results = await repo.listLocationReviews("tenant-1", "loc-1");
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("published");
  });

  it("returns empty when only pending reviews exist", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput({ bookingId: "b1" }), COMPLETED_BOOKING);
    expect(await repo.listLocationReviews("tenant-1", "loc-1")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// moderateReview
// ---------------------------------------------------------------------------

describe("createReviewRepository — moderateReview", () => {
  it("publishes a pending_moderation review", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput(), COMPLETED_BOOKING);
    const updated = await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    expect(updated.status).toBe("published");
    expect(updated.moderatedBy).toBe("admin-1");
  });

  it("records moderation reason", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput(), COMPLETED_BOOKING);
    const updated = await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "rejected", reason: "Fake" });
    expect(updated.moderationReason).toBe("Fake");
  });

  it("throws NOT_FOUND for unknown reviewId", async () => {
    await expect(makeRepo().moderateReview({ reviewId: "ghost", tenantId: "tenant-1", moderatorId: "admin-1", status: "published" }))
      .rejects.toThrow("NOT_FOUND");
  });

  it("throws INVALID_TRANSITION for disallowed change", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput(), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    await expect(repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "pending_moderation" as never }))
      .rejects.toThrow("INVALID_TRANSITION");
  });

  it("allows re-publishing a hidden review", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput(), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "hidden" });
    const final = await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    expect(final.status).toBe("published");
  });
});

// ---------------------------------------------------------------------------
// Rating aggregation
// ---------------------------------------------------------------------------

describe("createReviewRepository — getStaffRatingAggregate", () => {
  it("returns zero aggregate when no published reviews", async () => {
    expect(await makeRepo().getStaffRatingAggregate("tenant-1", "staff-1")).toEqual({ averageRating: 0, reviewCount: 0 });
  });

  it("does not count pending reviews", async () => {
    const repo = makeRepo();
    await repo.createReview(baseInput({ bookingId: "b1" }), COMPLETED_BOOKING);
    expect((await repo.getStaffRatingAggregate("tenant-1", "staff-1")).reviewCount).toBe(0);
  });

  it("aggregates multiple published reviews", async () => {
    const repo = makeRepo();
    for (const [bId, rating] of [["b1", 4], ["b2", 5], ["b3", 3]] as const) {
      const c = await repo.createReview(baseInput({ bookingId: bId, rating }), COMPLETED_BOOKING);
      await repo.moderateReview({ reviewId: c.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    }
    const agg = await repo.getStaffRatingAggregate("tenant-1", "staff-1");
    expect(agg.reviewCount).toBe(3);
    expect(agg.averageRating).toBe(4);
  });
});

describe("createReviewRepository — getLocationRatingAggregate", () => {
  it("returns zero aggregate when no published reviews", async () => {
    expect(await makeRepo().getLocationRatingAggregate("tenant-1", "loc-1")).toEqual({ averageRating: 0, reviewCount: 0 });
  });

  it("aggregates across staff for a location", async () => {
    const repo = makeRepo();
    for (const [bId, staffId, rating] of [["b1", "staff-1", 5], ["b2", "staff-2", 3]] as const) {
      const c = await repo.createReview(baseInput({ bookingId: bId, staffId, rating }), COMPLETED_BOOKING);
      await repo.moderateReview({ reviewId: c.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    }
    const agg = await repo.getLocationRatingAggregate("tenant-1", "loc-1");
    expect(agg.reviewCount).toBe(2);
    expect(agg.averageRating).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Aggregate cache
// ---------------------------------------------------------------------------

describe("createReviewRepository — aggregate cache", () => {
  it("moderateReview writes aggregate cache for staff after publish", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput(), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    // Cache hit: second call should return cached value, same result
    const agg = await repo.getStaffRatingAggregate("tenant-1", "staff-1");
    expect(agg.reviewCount).toBe(1);
    expect(agg.averageRating).toBe(5);
  });

  it("moderateReview writes aggregate cache for location after publish", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput({ rating: 3 }), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    const agg = await repo.getLocationRatingAggregate("tenant-1", "loc-1");
    expect(agg.reviewCount).toBe(1);
    expect(agg.averageRating).toBe(3);
  });

  it("cache reflects zero after review is hidden", async () => {
    const repo = makeRepo();
    const created = await repo.createReview(baseInput(), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    await repo.moderateReview({ reviewId: created.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "hidden" });
    const agg = await repo.getStaffRatingAggregate("tenant-1", "staff-1");
    expect(agg.reviewCount).toBe(0);
  });

  it("syncStaffAggregate recomputes and persists the cache", async () => {
    const repo = makeRepo();
    const c1 = await repo.createReview(baseInput({ bookingId: "b1", rating: 4 }), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: c1.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    const agg = await repo.syncStaffAggregate("tenant-1", "staff-1");
    expect(agg.reviewCount).toBe(1);
    expect(agg.averageRating).toBe(4);
  });

  it("syncLocationAggregate recomputes and persists the cache", async () => {
    const repo = makeRepo();
    const c1 = await repo.createReview(baseInput({ bookingId: "b1", rating: 5 }), COMPLETED_BOOKING);
    await repo.moderateReview({ reviewId: c1.reviewId, tenantId: "tenant-1", moderatorId: "admin-1", status: "published" });
    const agg = await repo.syncLocationAggregate("tenant-1", "loc-1");
    expect(agg.reviewCount).toBe(1);
    expect(agg.averageRating).toBe(5);
  });
});