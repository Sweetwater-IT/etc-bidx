import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import React from "react";
import { useTableSearchState } from "@/hooks/use-table-search-state";

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams("search=Turner&page=2");

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/quotes",
  useSearchParams: () => mockSearchParams,
}));

function Harness() {
  const { search, setSearch } = useTableSearchState({ debounceMs: 200 });

  return (
    <input
      aria-label="table-search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}

describe("useTableSearchState", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams("search=Turner&page=2");
    jest.useFakeTimers();
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    (window as any).scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("hydrates from the URL search param", async () => {
    render(<Harness />);

    await waitFor(() => expect(screen.getByLabelText("table-search")).toHaveValue("Turner"));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("syncs debounced search back to the URL", async () => {
    render(<Harness />);

    await waitFor(() => expect(screen.getByLabelText("table-search")).toHaveValue("Turner"));

    fireEvent.change(screen.getByLabelText("table-search"), { target: { value: "Redden" } });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenLastCalledWith("/quotes?search=Redden&page=2", { scroll: false });
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
