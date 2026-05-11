/**
 * w31MarketplaceExtras.test.tsx
 *
 * W31 Batch K — K.5 Marketplace Extras (20 tests)
 *
 * Covers: HashtagLandingScreen, TrendingFeedScreen,
 *         AuthorActionsSheet, FollowSalonButton
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  AuthorActionsSheet,
  FollowSalonButton,
  HashtagLandingScreen,
  TrendingFeedScreen,
} from "../src/app/marketplace/MarketplaceExtrasScreen";

// ---------------------------------------------------------------------------
// HashtagLandingScreen
// ---------------------------------------------------------------------------

describe("HashtagLandingScreen", () => {
  const posts = [
    {
      postId: "p1",
      imageUri: "https://example.com/img.jpg",
      salonName: "Cuts & Co",
      onPress: jest.fn(),
    },
    {
      postId: "p2",
      imageUri: "https://example.com/img2.jpg",
      salonName: "Bliss Studio",
      onPress: jest.fn(),
    },
  ];

  it("renders the hashtag name", () => {
    const { getByTestId } = render(
      <HashtagLandingScreen
        tag="balayage"
        posts={posts}
        onSelectPost={jest.fn()}
        testID="hl"
      />
    );
    expect(getByTestId("hl-tag")).toBeTruthy();
  });

  it("renders post count", () => {
    const { getByText } = render(
      <HashtagLandingScreen
        tag="balayage"
        posts={posts}
        onSelectPost={jest.fn()}
        testID="hl"
      />
    );
    expect(getByText("2 posts")).toBeTruthy();
  });

  it("renders all post cards", () => {
    const { getByTestId } = render(
      <HashtagLandingScreen
        tag="balayage"
        posts={posts}
        onSelectPost={jest.fn()}
        testID="hl"
      />
    );
    expect(getByTestId("hl-post-0")).toBeTruthy();
    expect(getByTestId("hl-post-1")).toBeTruthy();
  });

  it("calls onSelectPost when a post pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <HashtagLandingScreen
        tag="balayage"
        posts={posts}
        onSelectPost={onSelect}
        testID="hl"
      />
    );
    fireEvent.press(getByTestId("hl-post-0"));
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("shows empty state when no posts", () => {
    const { getByTestId } = render(
      <HashtagLandingScreen
        tag="missing"
        posts={[]}
        onSelectPost={jest.fn()}
        testID="hl"
      />
    );
    expect(getByTestId("hl-empty")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TrendingFeedScreen
// ---------------------------------------------------------------------------

describe("TrendingFeedScreen", () => {
  const topics = [
    { id: "t1", label: "Balayage" },
    { id: "t2", label: "Short cuts" },
  ];
  const posts = [
    {
      postId: "p1",
      imageUri: "https://example.com/img.jpg",
      salonName: "Cuts",
      onPress: jest.fn(),
    },
  ];
  const salons = [{ id: "s1", name: "Bliss Studio", isFollowing: false }];

  it("renders topic chips", () => {
    const { getByTestId } = render(
      <TrendingFeedScreen
        topics={topics}
        posts={posts}
        salonSuggestions={salons}
        onSelectPost={jest.fn()}
        onFollowSalon={jest.fn()}
        testID="tf"
      />
    );
    expect(getByTestId("tf-topic-t1")).toBeTruthy();
    expect(getByTestId("tf-topic-t2")).toBeTruthy();
  });

  it("renders salon follow toggles", () => {
    const { getByTestId } = render(
      <TrendingFeedScreen
        topics={topics}
        posts={posts}
        salonSuggestions={salons}
        onSelectPost={jest.fn()}
        onFollowSalon={jest.fn()}
        testID="tf"
      />
    );
    expect(getByTestId("tf-follow-s1")).toBeTruthy();
  });

  it("calls onFollowSalon when FollowToggle pressed", () => {
    const onFollow = jest.fn();
    const { getByTestId } = render(
      <TrendingFeedScreen
        topics={topics}
        posts={posts}
        salonSuggestions={salons}
        onSelectPost={jest.fn()}
        onFollowSalon={onFollow}
        testID="tf"
      />
    );
    fireEvent.press(getByTestId("tf-follow-s1"));
    expect(onFollow).toHaveBeenCalledWith("s1", true);
  });

  it("renders post cards", () => {
    const { getByTestId } = render(
      <TrendingFeedScreen
        topics={topics}
        posts={posts}
        salonSuggestions={salons}
        onSelectPost={jest.fn()}
        onFollowSalon={jest.fn()}
        testID="tf"
      />
    );
    expect(getByTestId("tf-post-0")).toBeTruthy();
  });

  it("shows empty state when no posts", () => {
    const { getByTestId } = render(
      <TrendingFeedScreen
        topics={topics}
        posts={[]}
        salonSuggestions={[]}
        onSelectPost={jest.fn()}
        onFollowSalon={jest.fn()}
        testID="tf"
      />
    );
    expect(getByTestId("tf-empty")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AuthorActionsSheet
// ---------------------------------------------------------------------------

describe("AuthorActionsSheet", () => {
  const baseProps = {
    visible: true,
    authorName: "stylestudio",
    onBlockAuthor: jest.fn(),
    onReportPost: jest.fn(),
    onDismiss: jest.fn(),
  };

  it("renders report and block actions", () => {
    const { getByTestId } = render(
      <AuthorActionsSheet {...baseProps} testID="aas" />
    );
    expect(getByTestId("aas-report")).toBeTruthy();
    expect(getByTestId("aas-block")).toBeTruthy();
  });

  it("calls onBlockAuthor when block pressed", () => {
    const onBlock = jest.fn();
    const { getByTestId } = render(
      <AuthorActionsSheet {...baseProps} onBlockAuthor={onBlock} testID="aas" />
    );
    fireEvent.press(getByTestId("aas-block"));
    expect(onBlock).toHaveBeenCalled();
  });

  it("transitions to report form when Report pressed", () => {
    const { getByTestId } = render(
      <AuthorActionsSheet {...baseProps} testID="aas" />
    );
    fireEvent.press(getByTestId("aas-report"));
    expect(
      getByTestId("aas-reason-spam-or-misleading")
    ).toBeTruthy();
  });

  it("renders submit button disabled until reason selected", () => {
    const { getByTestId } = render(
      <AuthorActionsSheet {...baseProps} testID="aas" />
    );
    fireEvent.press(getByTestId("aas-report"));
    expect(
      getByTestId("aas-submit-report").props.accessibilityState?.disabled
    ).toBeTruthy();
  });

  it("calls onReportPost when reason selected and submit pressed", () => {
    const onReport = jest.fn();
    const { getByTestId } = render(
      <AuthorActionsSheet
        {...baseProps}
        onReportPost={onReport}
        testID="aas"
      />
    );
    fireEvent.press(getByTestId("aas-report"));
    fireEvent.press(getByTestId("aas-reason-spam-or-misleading"));
    fireEvent.press(getByTestId("aas-submit-report"));
    expect(onReport).toHaveBeenCalledWith("Spam or misleading");
  });
});

// ---------------------------------------------------------------------------
// FollowSalonButton
// ---------------------------------------------------------------------------

describe("FollowSalonButton", () => {
  it("renders salon name", () => {
    const { getByTestId } = render(
      <FollowSalonButton
        salonId="s1"
        salonName="Bliss Studio"
        following={false}
        onToggle={jest.fn()}
        testID="fsb"
      />
    );
    expect(getByTestId("fsb-name")).toBeTruthy();
  });

  it("renders follow toggle", () => {
    const { getByTestId } = render(
      <FollowSalonButton
        salonId="s1"
        salonName="Bliss Studio"
        following={false}
        onToggle={jest.fn()}
        testID="fsb"
      />
    );
    expect(getByTestId("fsb-toggle")).toBeTruthy();
  });

  it("calls onToggle when toggleButton pressed", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <FollowSalonButton
        salonId="s1"
        salonName="Bliss Studio"
        following={false}
        onToggle={onToggle}
        testID="fsb"
      />
    );
    fireEvent.press(getByTestId("fsb-toggle"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("shows 'Following' label when following is true", () => {
    const { getByTestId } = render(
      <FollowSalonButton
        salonId="s1"
        salonName="Bliss Studio"
        following
        onToggle={jest.fn()}
        testID="fsb"
      />
    );
    expect(getByTestId("fsb-toggle-label").props.children).toBe("Following");
  });

  it("renders the provided salon name text", () => {
    const { getByText } = render(
      <FollowSalonButton
        salonId="s1"
        salonName="The Curl Bar"
        following={false}
        onToggle={jest.fn()}
        testID="fsb"
      />
    );
    expect(getByText("The Curl Bar")).toBeTruthy();
  });
});
