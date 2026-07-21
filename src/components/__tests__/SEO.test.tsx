import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { SEO } from "../SEO";

const renderWithHelmet = (ui: React.ReactElement) =>
  render(<HelmetProvider>{ui}</HelmetProvider>);

describe("SEO", () => {
  it("renders without crashing", () => {
    const { container } = renderWithHelmet(
      <SEO title="Test Page" description="A test page" />
    );
    expect(container).toBeTruthy();
  });

  it("accepts canonical URL", () => {
    const { container } = renderWithHelmet(
      <SEO title="Test" description="Test" canonical="https://example.com/page" />
    );
    expect(container).toBeTruthy();
  });
});
