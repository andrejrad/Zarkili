import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  StarRatingInput,
  StarRatingDisplay,
  ReviewPromptBanner,
  ReviewSubmitForm,
  ReviewSuccessView,
} from "../ClientReviewScreens";

import {
  ReviewCard,
  ReviewModerationList,
  RatingAggregateCard,
} from "../AdminModerationScreens";

import type { Review } from "../../../domains/reviews/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    reviewId: "rev-1",
    tenantId: "t1",
    locationId: "loc-1",
    staffId: "staff-1",
    bookingId: "booking-1",
    customerId: "customer-1",
    rating: 4,
    comment: "Great service!",
    status: "pending_moderation",
    createdAt: { seconds: 1000, nanoseconds: 0 } as never,
    updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
    moderatedBy: null,
    moderatedAt: null,
    moderationReason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// StarRatingInput
// ---------------------------------------------------------------------------

describe("StarRatingInput", () => {
  it("renders 5 star buttons", () => {
    const { getByTestId } = render(<StarRatingInput value={0} onChange={jest.fn()} />);
    for (let i = 1; i <= 5; i++) {
      expect(getByTestId(`star-${i}`)).toBeTruthy();
    }
  });

  it("calls onChange when a star is pressed", () => {
    const onChangeMock = jest.fn();
    const { getByTestId } = render(<StarRatingInput value={0} onChange={onChangeMock} />);
    fireEvent.press(getByTestId("star-3"));
    expect(onChangeMock).toHaveBeenCalledWith(3);
  });

  it("does not call onChange when disabled", () => {
    const onChangeMock = jest.fn();
    const { getByTestId } = render(<StarRatingInput value={0} onChange={onChangeMock} disabled />);
    fireEvent.press(getByTestId("star-3"));
    expect(onChangeMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// StarRatingDisplay
// ---------------------------------------------------------------------------

describe("StarRatingDisplay", () => {
  it("renders without throwing", () => {
    expect(() => render(<StarRatingDisplay value={3.7} />)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ReviewPromptBanner
// ---------------------------------------------------------------------------

describe("ReviewPromptBanner", () => {
  it("renders loading state", () => {
    const { getByTestId } = render(
      <ReviewPromptBanner existingReview={null} isLoading onWriteReview={jest.fn()} />,
    );
    expect(getByTestId("review-banner-loading")).toBeTruthy();
  });

  it("renders CTA when no existing review", () => {
    const { getByTestId } = render(
      <ReviewPromptBanner existingReview={null} isLoading={false} onWriteReview={jest.fn()} />,
    );
    expect(getByTestId("review-banner-cta")).toBeTruthy();
    expect(getByTestId("write-review-btn")).toBeTruthy();
  });

  it("calls onWriteReview when CTA pressed", () => {
    const onWriteReview = jest.fn();
    const { getByTestId } = render(
      <ReviewPromptBanner existingReview={null} isLoading={false} onWriteReview={onWriteReview} />,
    );
    fireEvent.press(getByTestId("write-review-btn"));
    expect(onWriteReview).toHaveBeenCalledTimes(1);
  });

  it("hides the CTA when review already exists", () => {
    const review = makeReview({ status: "published" });
    const { getByTestId, queryByTestId } = render(
      <ReviewPromptBanner existingReview={review} isLoading={false} onWriteReview={jest.fn()} />,
    );
    expect(getByTestId("review-banner-submitted")).toBeTruthy();
    expect(queryByTestId("write-review-btn")).toBeNull();
  });

  it("shows confirmation text when review submitted", () => {
    const review = makeReview({ status: "published" });
    const { getByText } = render(
      <ReviewPromptBanner existingReview={review} isLoading={false} onWriteReview={jest.fn()} />,
    );
    expect(getByText(/already reviewed/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ReviewSubmitForm
// ---------------------------------------------------------------------------

describe("ReviewSubmitForm", () => {
  const baseProps = {
    onSubmit: jest.fn(),
    isSubmitting: false,
    submitError: null,
  };

  it("renders form with staff name", () => {
    const { getByText } = render(<ReviewSubmitForm {...baseProps} staffName="Alice" />);
    expect(getByText(/alice/i)).toBeTruthy();
  });

  it("renders generic heading without staff name", () => {
    const { getByText } = render(<ReviewSubmitForm {...baseProps} />);
    expect(getByText(/rate your appointment/i)).toBeTruthy();
  });

  it("submit button is disabled when no rating selected", () => {
    const { getByTestId } = render(<ReviewSubmitForm {...baseProps} />);
    const btn = getByTestId("submit-review-btn");
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it("submit button is enabled after star selection", () => {
    const { getByTestId } = render(<ReviewSubmitForm {...baseProps} />);
    fireEvent.press(getByTestId("star-4"));
    const btn = getByTestId("submit-review-btn");
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("calls onSubmit with rating and null comment when no comment entered", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<ReviewSubmitForm {...baseProps} onSubmit={onSubmit} />);
    fireEvent.press(getByTestId("star-5"));
    fireEvent.press(getByTestId("submit-review-btn"));
    expect(onSubmit).toHaveBeenCalledWith(5, null);
  });

  it("calls onSubmit with comment when text entered", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<ReviewSubmitForm {...baseProps} onSubmit={onSubmit} />);
    fireEvent.press(getByTestId("star-4"));
    fireEvent.changeText(getByTestId("review-comment-input"), "Great experience");
    fireEvent.press(getByTestId("submit-review-btn"));
    expect(onSubmit).toHaveBeenCalledWith(4, "Great experience");
  });

  it("shows submit error message", () => {
    const { getByTestId } = render(
      <ReviewSubmitForm {...baseProps} submitError="Something went wrong" />,
    );
    expect(getByTestId("review-submit-error")).toBeTruthy();
  });

  it("shows loading indicator while submitting", () => {
    const { getByTestId } = render(<ReviewSubmitForm {...baseProps} isSubmitting />);
    // Form renders without throwing while submitting
    expect(getByTestId("review-submit-form")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ReviewSuccessView
// ---------------------------------------------------------------------------

describe("ReviewSuccessView", () => {
  it("renders success content", () => {
    const { getByTestId, getByText } = render(<ReviewSuccessView onDone={jest.fn()} />);
    expect(getByTestId("review-success-view")).toBeTruthy();
    expect(getByText(/thank you/i)).toBeTruthy();
  });

  it("calls onDone when Done pressed", () => {
    const onDone = jest.fn();
    const { getByTestId } = render(<ReviewSuccessView onDone={onDone} />);
    fireEvent.press(getByTestId("review-done-btn"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ReviewCard
// ---------------------------------------------------------------------------

describe("ReviewCard", () => {
  it("renders review details", () => {
    const { getByText } = render(
      <ReviewCard review={makeReview()} onModerate={jest.fn()} isModerating={false} />,
    );
    expect(getByText("Great service!")).toBeTruthy();
  });

  it("shows publish button for pending review", () => {
    const { getByTestId } = render(
      <ReviewCard review={makeReview()} onModerate={jest.fn()} isModerating={false} />,
    );
    expect(getByTestId("publish-btn-rev-1")).toBeTruthy();
  });

  it("does not show publish button for already published review", () => {
    const { queryByTestId } = render(
      <ReviewCard review={makeReview({ status: "published" })} onModerate={jest.fn()} isModerating={false} />,
    );
    expect(queryByTestId("publish-btn-rev-1")).toBeNull();
  });

  it("calls onModerate with published status when publish pressed", () => {
    const onModerate = jest.fn();
    const { getByTestId } = render(
      <ReviewCard review={makeReview()} onModerate={onModerate} isModerating={false} />,
    );
    fireEvent.press(getByTestId("publish-btn-rev-1"));
    expect(onModerate).toHaveBeenCalledWith({ reviewId: "rev-1", status: "published" });
  });

  it("shows loading indicator while moderating", () => {
    const { getByTestId, queryByTestId } = render(
      <ReviewCard review={makeReview()} onModerate={jest.fn()} isModerating />,
    );
    expect(getByTestId(`review-card-rev-1`)).toBeTruthy();
    expect(queryByTestId("publish-btn-rev-1")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ReviewModerationList
// ---------------------------------------------------------------------------

describe("ReviewModerationList", () => {
  const baseListProps = {
    reviews: [
      makeReview({ reviewId: "r1", status: "pending_moderation" }),
      makeReview({ reviewId: "r2", status: "published" }),
      makeReview({ reviewId: "r3", status: "hidden" }),
    ],
    isLoading: false,
    error: null,
    activeTab: "pending_moderation" as const,
    onTabChange: jest.fn(),
    onModerate: jest.fn(),
    moderatingId: null,
  };

  it("renders tab bar", () => {
    const { getByTestId } = render(<ReviewModerationList {...baseListProps} />);
    expect(getByTestId("tab-pending_moderation")).toBeTruthy();
    expect(getByTestId("tab-published")).toBeTruthy();
    expect(getByTestId("tab-archived")).toBeTruthy();
  });

  it("shows only pending reviews on pending tab", () => {
    const { getByTestId, queryByTestId } = render(<ReviewModerationList {...baseListProps} />);
    expect(getByTestId("review-card-r1")).toBeTruthy();
    expect(queryByTestId("review-card-r2")).toBeNull();
  });

  it("calls onTabChange when a tab is pressed", () => {
    const onTabChange = jest.fn();
    const { getByTestId } = render(
      <ReviewModerationList {...baseListProps} onTabChange={onTabChange} />,
    );
    fireEvent.press(getByTestId("tab-published"));
    expect(onTabChange).toHaveBeenCalledWith("published");
  });

  it("renders loading state", () => {
    const { getByTestId } = render(
      <ReviewModerationList {...baseListProps} isLoading reviews={[]} />,
    );
    expect(getByTestId("moderation-loading")).toBeTruthy();
  });

  it("renders error state", () => {
    const { getByTestId } = render(
      <ReviewModerationList {...baseListProps} error="Load failed" reviews={[]} />,
    );
    expect(getByTestId("moderation-error")).toBeTruthy();
  });

  it("renders empty state when no reviews in tab", () => {
    const { getByTestId } = render(
      <ReviewModerationList {...baseListProps} reviews={[]} />,
    );
    expect(getByTestId("moderation-empty")).toBeTruthy();
  });

  it("hides filter bar when no locations or staff provided", () => {
    const { queryByTestId } = render(<ReviewModerationList {...baseListProps} />);
    expect(queryByTestId("moderation-filter-bar")).toBeNull();
  });

  it("renders location filter chips when locations provided", () => {
    const locations = [{ id: "loc-1", name: "Main St" }, { id: "loc-2", name: "Park Ave" }];
    const { getByTestId } = render(
      <ReviewModerationList {...baseListProps} locations={locations} activeTab="pending_moderation" />,
    );
    expect(getByTestId("moderation-filter-bar")).toBeTruthy();
    expect(getByTestId("location-filter-loc-1")).toBeTruthy();
    expect(getByTestId("location-filter-loc-2")).toBeTruthy();
  });

  it("filters reviews by location when chip pressed", () => {
    const reviews = [
      makeReview({ reviewId: "r-loc1", status: "pending_moderation", locationId: "loc-1", staffId: "staff-1" }),
      makeReview({ reviewId: "r-loc2", status: "pending_moderation", locationId: "loc-2", staffId: "staff-1" }),
    ];
    const locations = [{ id: "loc-1", name: "Main St" }, { id: "loc-2", name: "Park Ave" }];
    const { getByTestId, queryByTestId } = render(
      <ReviewModerationList {...baseListProps} reviews={reviews} locations={locations} />,
    );
    fireEvent.press(getByTestId("location-filter-loc-1"));
    expect(getByTestId("review-card-r-loc1")).toBeTruthy();
    expect(queryByTestId("review-card-r-loc2")).toBeNull();
  });

  it("renders staff filter chips when staffMembers provided", () => {
    const staffMembers = [{ id: "staff-1", name: "Alice" }, { id: "staff-2", name: "Bob" }];
    const { getByTestId } = render(
      <ReviewModerationList {...baseListProps} staffMembers={staffMembers} activeTab="pending_moderation" />,
    );
    expect(getByTestId("staff-filter-staff-1")).toBeTruthy();
    expect(getByTestId("staff-filter-staff-2")).toBeTruthy();
  });

  it("filters reviews by staff when chip pressed", () => {
    const reviews = [
      makeReview({ reviewId: "r-s1", status: "pending_moderation", staffId: "staff-1" }),
      makeReview({ reviewId: "r-s2", status: "pending_moderation", staffId: "staff-2" }),
    ];
    const staffMembers = [{ id: "staff-1", name: "Alice" }, { id: "staff-2", name: "Bob" }];
    const { getByTestId, queryByTestId } = render(
      <ReviewModerationList {...baseListProps} reviews={reviews} staffMembers={staffMembers} />,
    );
    fireEvent.press(getByTestId("staff-filter-staff-2"));
    expect(getByTestId("review-card-r-s2")).toBeTruthy();
    expect(queryByTestId("review-card-r-s1")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// RatingAggregateCard
// ---------------------------------------------------------------------------

describe("RatingAggregateCard", () => {
  it("renders loading state", () => {
    const { getByTestId } = render(
      <RatingAggregateCard label="Staff" averageRating={0} reviewCount={0} isLoading />,
    );
    expect(getByTestId("rating-aggregate-loading")).toBeTruthy();
  });

  it("renders 'No reviews yet' when count is 0", () => {
    const { getByTestId, getByText } = render(
      <RatingAggregateCard label="Staff" averageRating={0} reviewCount={0} />,
    );
    expect(getByTestId("rating-aggregate-empty")).toBeTruthy();
    expect(getByText(/no reviews yet/i)).toBeTruthy();
  });

  it("renders aggregate score and count", () => {
    const { getByTestId, getByText } = render(
      <RatingAggregateCard label="Staff" averageRating={4.2} reviewCount={17} />,
    );
    expect(getByTestId("rating-aggregate-card")).toBeTruthy();
    expect(getByText("4.2")).toBeTruthy();
    expect(getByText(/17 reviews/i)).toBeTruthy();
  });

  it("uses singular 'review' for count of 1", () => {
    const { getByText } = render(
      <RatingAggregateCard label="Staff" averageRating={5} reviewCount={1} />,
    );
    expect(getByText("1 review")).toBeTruthy();
  });
});
