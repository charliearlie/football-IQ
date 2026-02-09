/**
 * LaundryLine Component Tests
 *
 * TDD tests for the vertical timeline component that displays
 * kit sponsor/supplier history for The Thread game mode.
 */

import { render, screen } from "@testing-library/react-native";
import { LaundryLine } from "../LaundryLine";
import type { ThreadBrand } from "../../types/theThread.types";

// Mock brands for testing
const mockBrands: ThreadBrand[] = [
  { brand_name: "Sharp", years: "1982-2000" },
  { brand_name: "Vodafone", years: "2000-2006" },
  { brand_name: "AIG", years: "2006-2010" },
];

const mockBrandsLong: ThreadBrand[] = [
  { brand_name: "Sharp", years: "1982-2000" },
  { brand_name: "Vodafone", years: "2000-2006" },
  { brand_name: "AIG", years: "2006-2010" },
  { brand_name: "Aon", years: "2010-2014" },
  { brand_name: "Chevrolet", years: "2014-2021" },
  { brand_name: "TeamViewer", years: "2021-" },
];

describe("LaundryLine", () => {
  describe("Brand Node Rendering", () => {
    it("renders correct number of brand nodes", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      expect(screen.getByTestId("laundry-line-node-0")).toBeTruthy();
      expect(screen.getByTestId("laundry-line-node-1")).toBeTruthy();
      expect(screen.getByTestId("laundry-line-node-2")).toBeTruthy();
    });

    it("displays brand names correctly", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("Sharp")).toBeTruthy();
      expect(screen.getByText("Vodafone")).toBeTruthy();
      expect(screen.getByText("AIG")).toBeTruthy();
    });

    it("displays year ranges correctly", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("1982-2000")).toBeTruthy();
      expect(screen.getByText("2000-2006")).toBeTruthy();
      expect(screen.getByText("2006-2010")).toBeTruthy();
    });

    it("renders all nodes for long brand lists", () => {
      render(
        <LaundryLine
          brands={mockBrandsLong}
          threadType="sponsor"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      // Should render all 6 nodes
      expect(screen.getByTestId("laundry-line-node-0")).toBeTruthy();
      expect(screen.getByTestId("laundry-line-node-5")).toBeTruthy();
      expect(screen.getByText("TeamViewer")).toBeTruthy();
    });
  });

  describe("Theme Color Switching", () => {
    it("applies sponsor theme color (yellow) for sponsor type", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      const header = screen.getByTestId("laundry-line-header");
      // cardYellow = #FACC15
      // Style is an array, so we check if it contains the color
      const styles = Array.isArray(header.props.style)
        ? header.props.style
        : [header.props.style];
      const hasYellowColor = styles.some(
        (style: Record<string, unknown>) => style?.color === "#FACC15"
      );
      expect(hasYellowColor).toBe(true);
    });

    it("applies supplier theme color (green) for supplier type", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="supplier"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      const header = screen.getByTestId("laundry-line-header");
      // pitchGreen = #58CC02
      // Style is an array, so we check if it contains the color
      const styles = Array.isArray(header.props.style)
        ? header.props.style
        : [header.props.style];
      const hasGreenColor = styles.some(
        (style: Record<string, unknown>) => style?.color === "#58CC02"
      );
      expect(hasGreenColor).toBe(true);
    });

    it("shows correct emoji for sponsor type", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("🤝")).toBeTruthy();
    });

    it("shows correct emoji for supplier type", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="supplier"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("🧵")).toBeTruthy();
    });

    it("shows correct label for sponsor type", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("Kit Sponsors")).toBeTruthy();
    });

    it("shows correct label for supplier type", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="supplier"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("Kit Suppliers")).toBeTruthy();
    });
  });

  describe("Game Status States", () => {
    it("renders normally during playing state", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      expect(screen.getByTestId("laundry-line")).toBeTruthy();
      expect(screen.getByText("Sharp")).toBeTruthy();
    });

    it("renders correctly in won state", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="won"
          testID="laundry-line"
        />
      );

      expect(screen.getByTestId("laundry-line")).toBeTruthy();
    });

    it("renders correctly in revealed state", () => {
      render(
        <LaundryLine
          brands={mockBrands}
          threadType="sponsor"
          gameStatus="revealed"
          testID="laundry-line"
        />
      );

      expect(screen.getByTestId("laundry-line")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty brands array gracefully", () => {
      render(
        <LaundryLine
          brands={[]}
          threadType="sponsor"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      // Should still render the header but no nodes
      expect(screen.getByText("🤝")).toBeTruthy();
      expect(screen.getByText("Kit Sponsors")).toBeTruthy();
      expect(screen.queryByTestId("laundry-line-node-0")).toBeNull();
    });

    it("handles ongoing year range (YYYY-)", () => {
      const brandsWithOngoing: ThreadBrand[] = [
        { brand_name: "Nike", years: "2015-2020" },
        { brand_name: "Adidas", years: "2020-2023" },
        { brand_name: "Puma", years: "2023-" },
      ];

      render(
        <LaundryLine
          brands={brandsWithOngoing}
          threadType="supplier"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("2023-")).toBeTruthy();
      expect(screen.getByText("Puma")).toBeTruthy();
    });

    it("renders correctly with minimum 3 brands", () => {
      const minBrands: ThreadBrand[] = [
        { brand_name: "Brand1", years: "2000-2005" },
        { brand_name: "Brand2", years: "2005-2010" },
        { brand_name: "Brand3", years: "2010-2015" },
      ];

      render(
        <LaundryLine
          brands={minBrands}
          threadType="sponsor"
          gameStatus="playing"
          testID="laundry-line"
        />
      );

      expect(screen.getByTestId("laundry-line-node-0")).toBeTruthy();
      expect(screen.getByTestId("laundry-line-node-1")).toBeTruthy();
      expect(screen.getByTestId("laundry-line-node-2")).toBeTruthy();
    });

    it("handles brands with special characters in names", () => {
      const specialBrands: ThreadBrand[] = [
        { brand_name: "O2", years: "2005-2010" },
        { brand_name: "T-Mobile", years: "2010-2012" },
        { brand_name: "Emirates Airlines", years: "2012-" },
      ];

      render(
        <LaundryLine
          brands={specialBrands}
          threadType="sponsor"
          gameStatus="playing"
        />
      );

      expect(screen.getByText("O2")).toBeTruthy();
      expect(screen.getByText("T-Mobile")).toBeTruthy();
      expect(screen.getByText("Emirates Airlines")).toBeTruthy();
    });
  });
});
