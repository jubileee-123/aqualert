import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FloodChecker } from "@/components/landing/flood-checker";

vi.mock("@/lib/hooks/queries", () => ({ useSiteOverviews: () => ({ data: undefined, isPending: true }) }));

describe("FloodChecker", () => {
  it("shows an empty state until an area is chosen", () => {
    render(<FloodChecker />);
    expect(screen.getByText("Choose an area to see its flood risk")).toBeInTheDocument();
  });

  it("estimates risk for a searched area and updates with rain intensity", () => {
    render(<FloodChecker />);
    const input = screen.getByRole("combobox", { name: "Your area" });
    fireEvent.change(input, { target: { value: "alaj" } });
    fireEvent.click(screen.getByRole("option", { name: /Alajo/ }));

    expect(screen.getByTestId("checker-place")).toHaveTextContent("Alajo");

    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent("Low");

    fireEvent.click(screen.getByRole("button", { name: "Extreme" }));
    fireEvent.click(screen.getByRole("button", { name: "3 hours" }));
    expect(screen.getByTestId("checker-likelihood")).toHaveTextContent(/High|Very high/);
    expect(screen.getByText(/not an official forecast/)).toBeInTheDocument();
  });

  it("offers a map search when the area is not in the local list", () => {
    render(<FloodChecker />);
    fireEvent.change(screen.getByRole("combobox", { name: "Your area" }), { target: { value: "Spintex Road" } });
    expect(screen.getByRole("option", { name: /Search the map for/ })).toBeInTheDocument();
  });

  it("supports quick picks", () => {
    render(<FloodChecker />);
    fireEvent.click(screen.getByRole("button", { name: "Kaneshie" }));
    expect(screen.getByTestId("checker-place")).toHaveTextContent("Kaneshie");
  });
});
