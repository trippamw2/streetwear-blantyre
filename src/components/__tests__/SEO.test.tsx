import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { SEO, canonicalPathFor } from "../SEO";

const renderWithHelmet = (ui: React.ReactElement) =>
  render(
    <HelmetProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </HelmetProvider>
  );

describe("SEO", () => {
  it("renders without crashing", () => {
    const { container } = renderWithHelmet(
      <SEO title="Test Page" description="A test page" />
    );
    expect(container).toBeTruthy();
  });

  it("accepts canonical URL", () => {
    const { container } = renderWithHelmet(
      <SEO title="Test" description="Test" path="/test" />
    );
    expect(container).toBeTruthy();
  });

  it("derives a clean LF canonical from the route", () => {
    const canonicalPath = canonicalPathFor("lake-fresh", "/lf/fish/chambo");
    expect(canonicalPath).toBe("/fish/chambo");
    expect(canonicalPath).not.toContain("/lf/");
    expect(canonicalPathFor("sb", "/lf/fish/chambo")).toBe("/lf/fish/chambo");
  });
});
