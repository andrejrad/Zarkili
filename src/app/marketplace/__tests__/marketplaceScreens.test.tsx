/**
 * marketplaceScreens.test.tsx — W28 Batch H
 *
 * Tests for all marketplace consumer screens and shared/ui primitives:
 *  – PostCard
 *  – SaveToggle / SavedToast
 *  – ShareTargetRow
 *  – MarketplacePostDetailScreen (H.1)
 *  – SavedPostsScreen (H.2)
 *  – ShareSheetScreen (H.3)
 *  – BookThisLookScreen (H.4)
 */

import { fireEvent, render, screen } from "@testing-library/react-native";

import { PostCard, SaveToggle, SavedToast, ShareTargetRow } from "../../../shared/ui";
import { BookThisLookScreen } from "../BookThisLookScreen";
import { MarketplacePostDetailScreen } from "../MarketplacePostDetailScreen";
import { SavedPostsScreen } from "../SavedPostsScreen";
import { ShareSheetScreen } from "../ShareSheetScreen";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_POST = {
  postId: "post-1",
  title: "Trending Balayage Techniques",
  description: "A beautiful balayage look with warm honey tones and natural movement.",
  imageUri: "https://example.com/post1.jpg",
  tags: ["balayage", "hair", "warm"],
  salonId: "salon-1",
  salonName: "Velvet Studio",
  salonInitials: "VS",
  saved: false,
  commentCount: 12,
};

const MOCK_RELATED: import("../MarketplacePostDetailScreen").RelatedPost[] = [
  { postId: "rel-1", title: "Winter Highlights", imageUri: "https://example.com/rel1.jpg", saved: false },
  { postId: "rel-2", title: "Natural Waves", imageUri: "https://example.com/rel2.jpg", saved: true },
];

const MOCK_SERVICE: import("../BookThisLookScreen").MappedService = {
  serviceId: "svc-1",
  serviceName: "Full Balayage",
  salonName: "Velvet Studio",
  priceFrom: 85,
  currency: "$",
  durationMinutes: 120,
};

const MOCK_CONTACTS: import("../ShareSheetScreen").ShareContact[] = [
  { contactId: "c1", name: "Sarah Johnson", initials: "SJ", selected: false },
  { contactId: "c2", name: "Maria Lopez", initials: "ML", selected: true },
];

// ─── PostCard ─────────────────────────────────────────────────────────────────

describe("PostCard", () => {
  it("renders title and save button", () => {
    render(
      <PostCard
        postId="p1"
        title="Trending Balayage"
        imageUri="https://example.com/img.jpg"
        testID="card"
      />
    );
    expect(screen.getByText("Trending Balayage")).toBeTruthy();
    expect(screen.getByTestId("card-save")).toBeTruthy();
  });

  it("renders saved state with Saved label", () => {
    render(
      <PostCard
        postId="p1"
        title="Look"
        imageUri=""
        saved
        testID="card"
      />
    );
    // card-save button has accessibilityLabel "Saved" when saved=true
    expect(screen.getByTestId("card-save")).toBeTruthy();
  });

  it("calls onPressSave when heart pressed", () => {
    const onPressSave = jest.fn();
    render(
      <PostCard
        postId="p1"
        title="Look"
        imageUri=""
        onPressSave={onPressSave}
        testID="card"
      />
    );
    fireEvent.press(screen.getByTestId("card-save"));
    expect(onPressSave).toHaveBeenCalledTimes(1);
  });

  it("calls onPress when card pressed", () => {
    const onPress = jest.fn();
    render(
      <PostCard
        postId="p1"
        title="Look"
        imageUri=""
        onPress={onPress}
        testID="card"
      />
    );
    fireEvent.press(screen.getByRole("button", { name: "Look" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders shimmer loading state", () => {
    render(
      <PostCard
        postId="p1"
        title="Look"
        imageUri=""
        isLoading
        testID="loading-card"
      />
    );
    // Loading card hides content from accessibility
    expect(screen.queryByText("Look")).toBeNull();
  });
});

// ─── SaveToggle ───────────────────────────────────────────────────────────────

describe("SaveToggle", () => {
  it("renders Save label when unsaved", () => {
    render(<SaveToggle saved={false} testID="toggle" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("renders Saved label when saved", () => {
    render(<SaveToggle saved testID="toggle" />);
    expect(screen.getByRole("button", { name: "Saved" })).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<SaveToggle saved={false} onPress={onPress} testID="toggle" />);
    fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("SavedToast", () => {
  it("renders when visible", () => {
    render(<SavedToast visible testID="toast" />);
    expect(screen.getByText("Added to Saved")).toBeTruthy();
  });

  it("renders nothing when not visible", () => {
    render(<SavedToast visible={false} testID="toast" />);
    expect(screen.queryByText("Added to Saved")).toBeNull();
  });
});

// ─── ShareTargetRow ────────────────────────────────────────────────────────────

describe("ShareTargetRow", () => {
  it("renders name and initials", () => {
    render(
      <ShareTargetRow name="Sarah Johnson" initials="SJ" testID="row" />
    );
    expect(screen.getByText("Sarah Johnson")).toBeTruthy();
    expect(screen.getByText("SJ")).toBeTruthy();
  });

  it("renders selected state", () => {
    render(
      <ShareTargetRow
        name="Sarah Johnson"
        initials="SJ"
        selected
        testID="row"
      />
    );
    expect(screen.getByRole("button", { name: "Sarah Johnson, selected" })).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(
      <ShareTargetRow name="Sarah Johnson" initials="SJ" onPress={onPress} testID="row" />
    );
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ─── MarketplacePostDetailScreen ──────────────────────────────────────────────

describe("MarketplacePostDetailScreen", () => {
  it("renders post title", () => {
    render(
      <MarketplacePostDetailScreen
        post={MOCK_POST}
        relatedPosts={MOCK_RELATED}
        testID="post-detail"
      />
    );
    expect(screen.getByTestId("post-detail-title")).toBeTruthy();
    expect(screen.getByText("Trending Balayage Techniques")).toBeTruthy();
  });

  it("renders Book this look CTA", () => {
    render(
      <MarketplacePostDetailScreen
        post={MOCK_POST}
        relatedPosts={[]}
        testID="post-detail"
      />
    );
    expect(screen.getByTestId("post-detail-book-cta")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Book this look" })).toBeTruthy();
  });

  it("calls onPressBookThisLook when CTA pressed", () => {
    const onPressBookThisLook = jest.fn();
    render(
      <MarketplacePostDetailScreen
        post={MOCK_POST}
        relatedPosts={[]}
        onPressBookThisLook={onPressBookThisLook}
        testID="post-detail"
      />
    );
    fireEvent.press(screen.getByRole("button", { name: "Book this look" }));
    expect(onPressBookThisLook).toHaveBeenCalledTimes(1);
  });

  it("renders loading shimmer", () => {
    render(
      <MarketplacePostDetailScreen
        post={null}
        relatedPosts={[]}
        isLoading
        testID="post-detail"
      />
    );
    expect(screen.queryByRole("button", { name: "Book this look" })).toBeNull();
  });

  it("renders error state with retry", () => {
    const onPressRetry = jest.fn();
    render(
      <MarketplacePostDetailScreen
        post={null}
        relatedPosts={[]}
        isError
        onPressRetry={onPressRetry}
        testID="post-detail"
      />
    );
    expect(screen.getByText("Couldn't load this post")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("renders save toggle and calls onPressSave", () => {
    const onPressSave = jest.fn();
    render(
      <MarketplacePostDetailScreen
        post={MOCK_POST}
        relatedPosts={[]}
        onPressSave={onPressSave}
        testID="post-detail"
      />
    );
    fireEvent.press(screen.getByTestId("post-detail-save-toggle"));
    expect(onPressSave).toHaveBeenCalledWith("post-1", true);
  });

  it("renders related post cards", () => {
    render(
      <MarketplacePostDetailScreen
        post={MOCK_POST}
        relatedPosts={MOCK_RELATED}
        testID="post-detail"
      />
    );
    expect(screen.getByText("Related posts")).toBeTruthy();
    expect(screen.getByText("Winter Highlights")).toBeTruthy();
    expect(screen.getByText("Natural Waves")).toBeTruthy();
  });
});

// ─── SavedPostsScreen ─────────────────────────────────────────────────────────

describe("SavedPostsScreen", () => {
  const baseProps = {
    activeTab: "all" as const,
    onChangeTab: jest.fn(),
    savedPosts: [] as import("../SavedPostsScreen").SavedPost[],
    collections: [] as import("../SavedPostsScreen").Collection[],
  };

  it("renders empty state for all-saved tab", () => {
    render(<SavedPostsScreen {...baseProps} testID="saved" />);
    expect(screen.getByText("No saved posts yet")).toBeTruthy();
  });

  it("renders post grid when posts exist", () => {
    const posts: import("../SavedPostsScreen").SavedPost[] = [
      { postId: "p1", title: "Balayage Look", imageUri: "", saved: true },
      { postId: "p2", title: "Bob Cut", imageUri: "", saved: false },
    ];
    render(<SavedPostsScreen {...baseProps} savedPosts={posts} testID="saved" />);
    expect(screen.getByText("Balayage Look")).toBeTruthy();
    expect(screen.getByText("Bob Cut")).toBeTruthy();
  });

  it("switches to collections tab", () => {
    const onChangeTab = jest.fn();
    render(
      <SavedPostsScreen
        {...baseProps}
        onChangeTab={onChangeTab}
        testID="saved"
      />
    );
    fireEvent.press(screen.getByText("Collections"));
    expect(onChangeTab).toHaveBeenCalledWith("collections");
  });

  it("renders collections when on collections tab", () => {
    const collections: import("../SavedPostsScreen").Collection[] = [
      { collectionId: "col-1", name: "Spring Looks", coverImageUri: "", postCount: 5 },
    ];
    render(
      <SavedPostsScreen
        {...baseProps}
        activeTab="collections"
        collections={collections}
        testID="saved"
      />
    );
    expect(screen.getByText("Spring Looks")).toBeTruthy();
    expect(screen.getByText("5 posts")).toBeTruthy();
  });

  it("renders new collection tile on collections tab", () => {
    const onPressNewCollection = jest.fn();
    render(
      <SavedPostsScreen
        {...baseProps}
        activeTab="collections"
        onPressNewCollection={onPressNewCollection}
        testID="saved"
      />
    );
    fireEvent.press(screen.getByRole("button", { name: "New collection" }));
    expect(onPressNewCollection).toHaveBeenCalledTimes(1);
  });

  it("renders error state with retry", () => {
    const onPressRetry = jest.fn();
    render(
      <SavedPostsScreen
        {...baseProps}
        isError
        onPressRetry={onPressRetry}
        testID="saved"
      />
    );
    expect(screen.getByText("Couldn't load saved posts")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });
});

// ─── ShareSheetScreen ─────────────────────────────────────────────────────────

describe("ShareSheetScreen", () => {
  const baseProps = {
    contacts: MOCK_CONTACTS,
    noteValue: "",
  };

  it("renders header and contact names", () => {
    render(<ShareSheetScreen {...baseProps} testID="share" />);
    expect(screen.getByText("Share post")).toBeTruthy();
    expect(screen.getByText("Sarah Johnson")).toBeTruthy();
    expect(screen.getByText("Maria Lopez")).toBeTruthy();
  });

  it("renders Copy link action", () => {
    render(<ShareSheetScreen {...baseProps} testID="share" />);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy();
  });

  it("renders Link copied text when linkCopied is true", () => {
    render(<ShareSheetScreen {...baseProps} linkCopied testID="share" />);
    expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy();
  });

  it("calls onPressCopyLink when pressed", () => {
    const onPressCopyLink = jest.fn();
    render(
      <ShareSheetScreen
        {...baseProps}
        onPressCopyLink={onPressCopyLink}
        testID="share"
      />
    );
    fireEvent.press(screen.getByTestId("share-copy-link"));
    expect(onPressCopyLink).toHaveBeenCalledTimes(1);
  });

  it("shows Send button when at least one contact selected", () => {
    render(<ShareSheetScreen {...baseProps} testID="share" />);
    // Maria Lopez is selected
    expect(screen.getByTestId("share-send")).toBeTruthy();
  });

  it("renders error banner when isError", () => {
    render(<ShareSheetScreen {...baseProps} isError testID="share" />);
    expect(screen.getByText("Couldn't share. Please try again.")).toBeTruthy();
  });
});

// ─── BookThisLookScreen ───────────────────────────────────────────────────────

describe("BookThisLookScreen", () => {
  it("renders matched state with service card and book CTA", () => {
    render(
      <BookThisLookScreen
        lookState="matched"
        lookTitle="Trending Balayage"
        mappedService={MOCK_SERVICE}
        testID="book-look"
      />
    );
    expect(screen.getByText("Trending Balayage")).toBeTruthy();
    expect(screen.getByTestId("book-look-service-card")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Book Full Balayage" })).toBeTruthy();
  });

  it("calls onPressBook when book CTA pressed", () => {
    const onPressBook = jest.fn();
    render(
      <BookThisLookScreen
        lookState="matched"
        lookTitle="Balayage"
        mappedService={MOCK_SERVICE}
        onPressBook={onPressBook}
        testID="book-look"
      />
    );
    fireEvent.press(screen.getByTestId("book-look-book"));
    expect(onPressBook).toHaveBeenCalledTimes(1);
  });

  it("renders unmatched state", () => {
    render(
      <BookThisLookScreen
        lookState="unmatched"
        lookTitle="Rare Style"
        testID="book-look"
      />
    );
    expect(screen.getByTestId("book-look-unmatched")).toBeTruthy();
    expect(screen.getByText("We couldn't find an exact match")).toBeTruthy();
  });

  it("renders auth gate for unauthenticated state", () => {
    render(
      <BookThisLookScreen
        lookState="unauthenticated"
        lookTitle="Balayage"
        testID="book-look"
      />
    );
    expect(screen.getByTestId("book-look-auth-gate")).toBeTruthy();
    expect(screen.getByText("Sign in to book — or continue as guest")).toBeTruthy();
  });

  it("calls onPressSignIn from auth gate", () => {
    const onPressSignIn = jest.fn();
    render(
      <BookThisLookScreen
        lookState="unauthenticated"
        lookTitle="Balayage"
        onPressSignIn={onPressSignIn}
        testID="book-look"
      />
    );
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(onPressSignIn).toHaveBeenCalledTimes(1);
  });

  it("calls onPressContinueAsGuest from auth gate", () => {
    const onPressContinueAsGuest = jest.fn();
    render(
      <BookThisLookScreen
        lookState="unauthenticated"
        lookTitle="Balayage"
        onPressContinueAsGuest={onPressContinueAsGuest}
        testID="book-look"
      />
    );
    fireEvent.press(screen.getByRole("button", { name: "Continue as guest" }));
    expect(onPressContinueAsGuest).toHaveBeenCalledTimes(1);
  });

  it("renders expired link state", () => {
    render(
      <BookThisLookScreen lookState="expired" testID="book-look" />
    );
    expect(screen.getByText("This link has expired")).toBeTruthy();
  });

  it("renders error state with retry", () => {
    const onPressRetry = jest.fn();
    render(
      <BookThisLookScreen lookState="error" onPressRetry={onPressRetry} testID="book-look" />
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("renders loading state", () => {
    render(
      <BookThisLookScreen lookState="loading" testID="book-look" />
    );
    expect(screen.queryByText("Trending Balayage")).toBeNull();
  });

  it("renders find similar CTA on matched state", () => {
    const onPressFindSimilar = jest.fn();
    render(
      <BookThisLookScreen
        lookState="matched"
        mappedService={MOCK_SERVICE}
        onPressFindSimilar={onPressFindSimilar}
        testID="book-look"
      />
    );
    fireEvent.press(screen.getByTestId("book-look-find-similar"));
    expect(onPressFindSimilar).toHaveBeenCalledTimes(1);
  });
});
