import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  RatingStars,
  RangeSlider,
  GalleryCarousel,
  SalonHeroCard,
  StaffAvatarList,
  StickyCtaBar,
} from "../index";

describe("RatingStars", () => {
  it("renders 5 stars with default size, non-interactive role 'image'", () => {
    const { getByLabelText } = render(<RatingStars value={4.5} />);
    expect(getByLabelText("4.5 of 5 stars")).toBeTruthy();
  });

  it("invokes onChange in interactive mode", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RatingStars value={3} onChange={onChange} testID="stars" />,
    );
    fireEvent.press(getByTestId("stars-star-5"));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("clamps values above 5", () => {
    const { getByLabelText } = render(<RatingStars value={9} />);
    expect(getByLabelText("5 of 5 stars")).toBeTruthy();
  });
});

describe("RangeSlider single", () => {
  it("calls onChange with stepped value", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RangeSlider
        minValue={0}
        maxValue={50}
        step={5}
        value={10}
        onChange={onChange}
        testID="r"
      />,
    );
    fireEvent.press(getByTestId("r-inc"));
    expect(onChange).toHaveBeenCalledWith(15);
    fireEvent.press(getByTestId("r-dec"));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

describe("RangeSlider dual", () => {
  it("constrains min thumb below max thumb minus step", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RangeSlider
        minValue={0}
        maxValue={500}
        step={10}
        range={[100, 200]}
        onChange={onChange}
        testID="r2"
      />,
    );
    fireEvent.press(getByTestId("r2-lo-inc"));
    expect(onChange).toHaveBeenCalledWith([110, 200]);
  });
});

describe("GalleryCarousel", () => {
  it("renders one item per data entry", () => {
    const { getByTestId } = render(
      <GalleryCarousel
        testID="gal"
        items={[
          { id: "a", uri: "x", alt: "A" },
          { id: "b", uri: "y", alt: "B" },
        ]}
      />,
    );
    expect(getByTestId("gal")).toBeTruthy();
  });
});

describe("SalonHeroCard", () => {
  it("renders name + favorite toggle and fires callback", () => {
    const onFav = jest.fn();
    const { getByTestId, getByText } = render(
      <SalonHeroCard
        name="Bloom Studio"
        rating={4.6}
        reviewCount={128}
        metaLine="0.5 mi"
        hours="Open · closes 8:00 PM"
        onToggleFavorite={onFav}
        testID="hero"
      />,
    );
    expect(getByText("Bloom Studio")).toBeTruthy();
    fireEvent.press(getByTestId("hero-fav"));
    expect(onFav).toHaveBeenCalled();
  });
});

describe("StaffAvatarList", () => {
  it("marks selected item via accessibilityState", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <StaffAvatarList
        testID="staff"
        selectedId="s2"
        items={[
          { id: "s1", name: "Ada" },
          { id: "s2", name: "Bea" },
        ]}
        onPressItem={onPress}
      />,
    );
    fireEvent.press(getByTestId("staff-s1"));
    expect(onPress).toHaveBeenCalledWith({ id: "s1", name: "Ada" });
  });
});

describe("StickyCtaBar", () => {
  it("invokes primary and secondary callbacks", () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();
    const { getByTestId } = render(
      <StickyCtaBar
        primaryLabel="Book now"
        onPrimaryPress={onPrimary}
        primaryTestID="cta-primary"
        secondaryLabel="Save"
        onSecondaryPress={onSecondary}
        secondaryTestID="cta-secondary"
      />,
    );
    fireEvent.press(getByTestId("cta-primary"));
    fireEvent.press(getByTestId("cta-secondary"));
    expect(onPrimary).toHaveBeenCalled();
    expect(onSecondary).toHaveBeenCalled();
  });
});
