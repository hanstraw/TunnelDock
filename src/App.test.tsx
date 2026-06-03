import { render } from "@testing-library/react";
import App from "./App";
import { vi } from "vitest";

vi.mock("./components/TunnelDockApp", () => ({
  TunnelDockApp: () => <div data-testid="tunnel-dock-app" />
}));

describe("App", () => {
  it("renders TunnelDockApp", () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId("tunnel-dock-app")).toBeInTheDocument();
  });
});
