/**
 * reviewsEdgeScreens.test.tsx — W30 Batch J reviews edge screens.
 * J.11 ReviewsEdgeScreen / ReviewFilterSortSheet / ReviewPhotoLightbox /
 *      ReviewGuidelinesPage
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  ReviewsEdgeScreen,
  ReviewFilterSortSheet,
  ReviewPhotoLightbox,
  ReviewGuidelinesPage,
} from "../ReviewsEdgeScreen";
import type { ReviewListItem } from "../ReviewsEdgeScreen";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const REVIEWS: ReviewListItem[] = [
  {
    id: "r1",
    authorName: "Alice",
    rating: 5,
    body: "Absolutely loved it!",
    postedDate: "06/15/2025",
    helpfulCount: 12,
    unhelpfulCount: 1,
    userVote: null,
    photoCount: 2,
  },
  {
    id: "r2",
    authorName: "Bob",
    rating: 4,
    body: "Very good service.",
    postedDate: "06/10/2025",
    helpfulCount: 5,
    unhelpfulCount: 0,
    userVote: "helpful",
    salonReply: {
      salonName: "Glow Studio",
      text: "Thank you, Bob!",
      replyDate: "06/11/2025",
    },
    isMyReview: true,
  },
];

// ---------------------------------------------------------------------------
// J.11.1 — ReviewsEdgeScreen
// ---------------------------------------------------------------------------

describe("ReviewsEdgeScreen", () => {
  it("renders review cards with author names", () => {
    const { getByText } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={jest.fn()}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={jest.fn()}
      />,
    );
    expect(getByText("Alice")).toBeTruthy();
    expect(getByText("Bob")).toBeTruthy();
  });

  it("renders helpful/unhelpful chips", () => {
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={jest.fn()}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={jest.fn()}
        testID="re"
      />,
    );
    expect(getByTestId("re-vote-r1")).toBeTruthy();
    expect(getByTestId("re-vote-r2")).toBeTruthy();
  });

  it("calls onVoteHelpful when helpful chip pressed", () => {
    const onVoteHelpful = jest.fn();
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={onVoteHelpful}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={jest.fn()}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={jest.fn()}
        testID="re"
      />,
    );
    fireEvent.press(getByTestId("re-vote-r1-helpful"));
    expect(onVoteHelpful).toHaveBeenCalledWith("r1");
  });

  it("renders salon reply on r2", () => {
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={jest.fn()}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={jest.fn()}
        testID="re"
      />,
    );
    expect(getByTestId("re-reply-r2")).toBeTruthy();
  });

  it("renders photo row on r1", () => {
    const onOpenPhoto = jest.fn();
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={onOpenPhoto}
        onEditReview={jest.fn()}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={jest.fn()}
        testID="re"
      />,
    );
    fireEvent.press(getByTestId("re-photo-r1"));
    expect(onOpenPhoto).toHaveBeenCalledWith("r1", 0);
  });

  it("shows edit/delete for my-review and calls edit", () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={onEdit}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={jest.fn()}
        testID="re"
      />,
    );
    expect(getByTestId("re-edit-r2")).toBeTruthy();
    fireEvent.press(getByTestId("re-edit-r2"));
    expect(onEdit).toHaveBeenCalledWith("r2");
  });

  it("opens delete confirmation sheet, confirms, and calls onDeleteReview", () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={jest.fn()}
        onDeleteReview={onDelete}
        onOpenFilterSort={jest.fn()}
        testID="re"
      />,
    );
    fireEvent.press(getByTestId("re-delete-r2"));
    expect(getByTestId("re-delete-confirm-sheet")).toBeTruthy();
    fireEvent.press(getByTestId("re-confirm-delete"));
    expect(onDelete).toHaveBeenCalledWith("r2");
  });

  it("calls onOpenFilterSort when filter bar pressed", () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(
      <ReviewsEdgeScreen
        reviews={REVIEWS}
        onVoteHelpful={jest.fn()}
        onVoteUnhelpful={jest.fn()}
        onOpenPhoto={jest.fn()}
        onEditReview={jest.fn()}
        onDeleteReview={jest.fn()}
        onOpenFilterSort={onOpen}
        testID="re"
      />,
    );
    fireEvent.press(getByTestId("re-filter-sort"));
    expect(onOpen).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// J.11.2 — ReviewFilterSortSheet
// ---------------------------------------------------------------------------

describe("ReviewFilterSortSheet", () => {
  it("renders rating chips and sort options", () => {
    const { getByTestId } = render(
      <ReviewFilterSortSheet
        visible
        filter={{}}
        sort="newest"
        onApply={jest.fn()}
        onClose={jest.fn()}
        testID="rfs"
      />,
    );
    expect(getByTestId("rfs-rating-4")).toBeTruthy();
    expect(getByTestId("rfs-sort-highest-rated")).toBeTruthy();
  });

  it("calls onApply with updated filter when Apply pressed", () => {
    const onApply = jest.fn();
    const { getByTestId } = render(
      <ReviewFilterSortSheet
        visible
        filter={{}}
        sort="newest"
        onApply={onApply}
        onClose={jest.fn()}
        testID="rfs"
      />,
    );
    fireEvent.press(getByTestId("rfs-rating-4"));
    fireEvent.press(getByTestId("rfs-apply"));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ minRating: 4 }),
      "newest",
    );
  });

  it("toggles withPhotosOnly checkbox", () => {
    const onApply = jest.fn();
    const { getByTestId } = render(
      <ReviewFilterSortSheet
        visible
        filter={{}}
        sort="newest"
        onApply={onApply}
        onClose={jest.fn()}
        testID="rfs"
      />,
    );
    fireEvent.press(getByTestId("rfs-photos-filter"));
    fireEvent.press(getByTestId("rfs-apply"));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ withPhotosOnly: true }),
      "newest",
    );
  });
});

// ---------------------------------------------------------------------------
// J.11.3 — ReviewPhotoLightbox
// ---------------------------------------------------------------------------

describe("ReviewPhotoLightbox", () => {
  it("renders first photo placeholder and close button", () => {
    const { getByTestId } = render(
      <ReviewPhotoLightbox
        visible
        photoCount={3}
        initialIndex={0}
        onClose={jest.fn()}
        testID="lb"
      />,
    );
    expect(getByTestId("lb-photo-0")).toBeTruthy();
    expect(getByTestId("lb-close")).toBeTruthy();
  });

  it("navigates to next photo", () => {
    const { getByTestId } = render(
      <ReviewPhotoLightbox
        visible
        photoCount={3}
        initialIndex={0}
        onClose={jest.fn()}
        testID="lb"
      />,
    );
    fireEvent.press(getByTestId("lb-next"));
    expect(getByTestId("lb-photo-1")).toBeTruthy();
  });

  it("calls onClose", () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ReviewPhotoLightbox
        visible
        photoCount={2}
        onClose={onClose}
        testID="lb"
      />,
    );
    fireEvent.press(getByTestId("lb-close"));
    expect(onClose).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// J.11.4 — ReviewGuidelinesPage
// ---------------------------------------------------------------------------

describe("ReviewGuidelinesPage", () => {
  it("renders guidelines title and sections", () => {
    const { getByText } = render(<ReviewGuidelinesPage testID="guide" />);
    expect(getByText("Review Guidelines")).toBeTruthy();
    expect(getByText(/be authentic/i)).toBeTruthy();
    expect(getByText(/be respectful/i)).toBeTruthy();
  });
});
