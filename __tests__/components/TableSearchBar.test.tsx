import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableSearchBar } from "@/components/TableSearchBar";

describe("TableSearchBar", () => {
  it("renders the current value and placeholder", () => {
    render(
      <TableSearchBar
        value="Redden"
        onChange={jest.fn()}
        placeholder="Search quotes..."
      />
    );

    expect(screen.getByPlaceholderText("Search quotes...")).toHaveValue("Redden");
  });

  it("clears the search when the clear button is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <TableSearchBar
        value="Austin"
        onChange={handleChange}
        placeholder="Search quotes..."
      />
    );

    await user.click(screen.getByLabelText("Clear search"));

    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("shows the loading indicator when requested", () => {
    render(
      <TableSearchBar
        value=""
        onChange={jest.fn()}
        loading
        placeholder="Search quotes..."
      />
    );

    expect(screen.getByTestId("table-search-loading")).toBeInTheDocument();
  });
});
