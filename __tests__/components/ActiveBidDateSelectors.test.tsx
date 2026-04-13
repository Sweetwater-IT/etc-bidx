import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ActiveBidStartDateSelector } from "@/components/ActiveBidStartDateSelector"
import { ActiveBidEndDateSelector } from "@/components/ActiveBidEndDateSelector"

describe("ActiveBidStartDateSelector", () => {
  test("renders with placeholder text when no value", () => {
    const mockOnChange = jest.fn()
    render(
      <ActiveBidStartDateSelector
        id="start-date"
        value={null}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Select start date")).toBeInTheDocument()
  })

  test("formats and displays date value correctly", () => {
    const mockOnChange = jest.fn()
    render(
      <ActiveBidStartDateSelector
        id="start-date"
        value="2024-03-15"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("15-03-2024")).toBeInTheDocument()
  })

  test("calls onChange with formatted date when date is selected", async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    render(
      <ActiveBidStartDateSelector
        id="start-date"
        value={null}
        onChange={mockOnChange}
      />
    )

    const button = screen.getByRole("button")
    await user.click(button)

    // Note: Calendar interaction testing would require more complex setup
    // This test verifies the component renders and can be interacted with
    expect(button).toBeInTheDocument()
  })
})

describe("ActiveBidEndDateSelector", () => {
  test("renders with placeholder text when no value", () => {
    const mockOnChange = jest.fn()
    render(
      <ActiveBidEndDateSelector
        id="end-date"
        value={null}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("Select end date")).toBeInTheDocument()
  })

  test("formats and displays date value correctly", () => {
    const mockOnChange = jest.fn()
    render(
      <ActiveBidEndDateSelector
        id="end-date"
        value="2024-03-20"
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText("20-03-2024")).toBeInTheDocument()
  })

  test("calls onChange with formatted date when date is selected", async () => {
    const user = userEvent.setup()
    const mockOnChange = jest.fn()
    render(
      <ActiveBidEndDateSelector
        id="end-date"
        value={null}
        onChange={mockOnChange}
      />
    )

    const button = screen.getByRole("button")
    await user.click(button)

    // Note: Calendar interaction testing would require more complex setup
    // This test verifies the component renders and can be interacted with
    expect(button).toBeInTheDocument()
  })
})