import React from "react"
import "@testing-library/jest-dom"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { OwnerSelector } from "@/components/OwnerSelector"
import { CountySelector } from "@/components/CountySelector"
import { LettingDateSelector } from "@/components/LettingDateSelector"
import { DueDateSelector } from "@/components/DueDateSelector"
import { StartDateSelector } from "@/components/StartDateSelector"
import { EndDateSelector } from "@/components/EndDateSelector"

describe("standardized selector components", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    ;(window as typeof window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver

    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    ;(window.HTMLElement.prototype as HTMLElement & {
      hasPointerCapture?: (pointerId: number) => boolean
      setPointerCapture?: (pointerId: number) => void
      releasePointerCapture?: (pointerId: number) => void
    }).hasPointerCapture = jest.fn().mockReturnValue(false)
    ;(window.HTMLElement.prototype as HTMLElement & {
      setPointerCapture?: (pointerId: number) => void
    }).setPointerCapture = jest.fn()
    ;(window.HTMLElement.prototype as HTMLElement & {
      releasePointerCapture?: (pointerId: number) => void
    }).releasePointerCapture = jest.fn()

    if (!window.matchMedia) {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    }
  })

  test("OwnerSelector renders options and applies the selected owner", async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <OwnerSelector
        owners={[
          { id: "1", name: "PENNDOT" },
          { id: "2", name: "TURNPIKE" },
        ]}
        value=""
        onValueChange={handleChange}
      />
    )

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByText("TURNPIKE"))

    expect(handleChange).toHaveBeenCalledWith("TURNPIKE")
  })

  test("CountySelector opens a searchable scrollable list and selects a county", async () => {
    const user = userEvent.setup()
    const handleSelect = jest.fn()
    const counties = Array.from({ length: 80 }, (_, index) => ({
      id: index + 1,
      name: `County ${String.fromCharCode(65 + (index % 26))} ${index + 1}`,
    }))

    render(
      <CountySelector
        counties={counties}
        value=""
        onSelect={handleSelect}
      />
    )

    await user.click(screen.getByRole("combobox"))

    const list = screen.getByTestId("county-selector-list")
    expect(list).toHaveClass("max-h-80")
    expect(list).toHaveClass("overflow-y-auto")

    await user.type(screen.getByPlaceholderText("Search county..."), "County Z 26")
    await user.click(screen.getByText("County Z 26"))

    expect(handleSelect).toHaveBeenCalledWith("26")
  })

  test("LettingDateSelector formats dates and emits changed values", async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <LettingDateSelector
        id="letting-date"
        value={new Date("2026-04-15T15:00:00.000Z")}
        onChange={handleChange}
      />
    )

    expect(screen.getByRole("button", { name: /2026-04-15/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /2026-04-15/i }))
    await user.click(screen.getByRole("gridcell", { name: "22" }))

    await waitFor(() => {
      expect(handleChange).toHaveBeenLastCalledWith("2026-04-22")
    })
  })

  test("DueDateSelector formats string dates and emits changed values", async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(
      <DueDateSelector
        id="due-date"
        value="2026-04-20T00:00:00.000Z"
        onChange={handleChange}
      />
    )

    expect(screen.getByRole("button", { name: /2026-04-20/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /2026-04-20/i }))
    await user.click(screen.getByRole("gridcell", { name: "24" }))

    await waitFor(() => {
      expect(handleChange).toHaveBeenLastCalledWith("2026-04-24")
    })
  })

  test("StartDateSelector formats dates and emits changed values", async () => {
    const handleChange = jest.fn()

    render(
      <StartDateSelector
        id="start-date"
        value={new Date("2026-05-01T00:00:00.000Z")}
        onChange={handleChange}
      />
    )

    const input = screen.getByDisplayValue("2026-05-01")
    expect(input).toHaveValue("2026-05-01")

    fireEvent.change(input, { target: { value: "2026-05-10" } })

    await waitFor(() => {
      expect(handleChange).toHaveBeenLastCalledWith("2026-05-10")
    })
  })

  test("EndDateSelector supports a min date and emits changed values", async () => {
    const handleChange = jest.fn()

    render(
      <EndDateSelector
        id="end-date"
        value="2026-05-12T00:00:00.000Z"
        min="2026-05-01T00:00:00.000Z"
        onChange={handleChange}
      />
    )

    const input = screen.getByDisplayValue("2026-05-12")
    expect(input).toHaveValue("2026-05-12")
    expect(input).toHaveAttribute("min", "2026-05-01")

    fireEvent.change(input, { target: { value: "2026-05-18" } })

    await waitFor(() => {
      expect(handleChange).toHaveBeenLastCalledWith("2026-05-18")
    })
  })
})
