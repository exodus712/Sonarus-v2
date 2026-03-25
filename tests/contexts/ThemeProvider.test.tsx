// tests/contexts/ThemeProvider.test.tsx
import { render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../../src/contexts/ThemeProvider";

describe("ThemeProvider", () => {
  it("should provide default theme context", () => {
    const TestComponent = () => {
      const { theme, effectiveTheme } = useTheme();
      return (
        <div data-testid="theme">
          {theme}-{effectiveTheme}
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system-light");
  });
});
