import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomeScreen from "./HomeScreen";
import { vi } from "vitest";

// Mock the console methods to prevent test output from cluttering the terminal
// and to allow assertions on their calls.
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("HomeScreen", () => {
  // Clear mocks after each test to ensure isolation
  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Component Renders Correctly
  test("renders the main elements of the home screen", () => {
    render(<HomeScreen onJoinSuccess={() => {}} />);

    // Assert that key elements are present
    expect(screen.getByAltText("Hand & Brain Logo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Hand and Brain Chess/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /how to play/i })
    ).toBeInTheDocument();
  });

  // Test Case 2: Input Field Handlers - Name Input
  test("updates name input value and converts to uppercase, removing non-alphabetic/space characters", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);
    const nameInput = screen.getByLabelText(/name/i);

    // Test conversion to uppercase and removal of numbers/symbols
    await user.type(nameInput, "john doe123!");
    expect(nameInput).toHaveValue("JOHN DOE"); // Should convert to uppercase and remove numbers/symbols
  });

  // Test Case 3: Input Field Handlers - Room Code Input
  test("updates room code input value and converts to uppercase, removing non-alphabetic characters", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);
    const roomCodeInput = screen.getByLabelText(/room code/i);

    // Test conversion to uppercase and removal of numbers/symbols
    await user.type(roomCodeInput, "abcD123!");
    expect(roomCodeInput).toHaveValue("ABCD"); // Should convert to uppercase and remove numbers/symbols
  });

  // Test Case 4: Form Submission - Client-side validation for empty name
  test("displays error message for empty name on submission", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    const nameInput = screen.getByLabelText(/name/i);
    const roomCodeInput = screen.getByLabelText(/room code/i);
    const playButton = screen.getByRole("button", { name: /play/i });

    await user.clear(nameInput); // Ensure name is empty
    await user.type(roomCodeInput, "ABCD");
    await user.click(playButton);

    expect(screen.getByText(/a name is required/i)).toBeInTheDocument();
    expect(mockConsoleError).not.toHaveBeenCalled(); // No console error for client-side validation
    expect(fetch).not.toHaveBeenCalled(); // API call should not be made
  });

  // Test Case 5: Form Submission - Client-side validation for invalid room code
  test("displays error message for invalid room code on submission", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    const nameInput = screen.getByLabelText(/name/i);
    const roomCodeInput = screen.getByLabelText(/room code/i);
    const playButton = screen.getByRole("button", { name: /play/i });

    await user.type(nameInput, "PLAYERONE");
    await user.type(roomCodeInput, "ABC"); // Invalid length
    await user.click(playButton);

    expect(
      screen.getByText(/room code must be 4 letters/i)
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled(); // API call should not be made

    await user.clear(roomCodeInput);
    await user.type(roomCodeInput, "1234"); // Invalid characters
    await user.click(playButton);
    expect(
      screen.getByText(/room code must be 4 letters/i)
    ).toBeInTheDocument();
  });

  // Test Case 6: Form Submission - Successful room join
  test("calls API and onJoinSuccess callback on successful submission", async () => {
    const user = userEvent.setup();
    const mockOnJoinSuccess = vi.fn(); // Mock the callback prop
    const mockRoomData = {
      room: { id: "ROOM123", code: "ABCD" },
      player: { id: "PLAYER1", name: "TESTER" },
    };

    // Mock the fetch API call
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoomData),
    } as Response);

    render(<HomeScreen onJoinSuccess={mockOnJoinSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const roomCodeInput = screen.getByLabelText(/room code/i);
    const playButton = screen.getByRole("button", { name: /play/i });

    await user.type(nameInput, "PLAYERONE");
    await user.type(roomCodeInput, "ABCD");
    await user.click(playButton);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/rooms/join",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "PLAYERONE", roomCode: "ABCD" }),
        }
      );
      expect(mockOnJoinSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnJoinSuccess).toHaveBeenCalledWith(
        mockRoomData.room,
        mockRoomData.player
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Successfully joined room:",
        mockRoomData
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(); // Error message should not be present
    });
  });

  // Test Case 7: Form Submission - API error response
  test("displays API error message on unsuccessful submission", async () => {
    const user = userEvent.setup();
    const mockOnJoinSuccess = vi.fn();
    const errorMessage = "Room not found or full.";

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false, // Indicate an error response
      json: () => Promise.resolve({ message: errorMessage }),
    } as Response);

    render(<HomeScreen onJoinSuccess={mockOnJoinSuccess} />);

    await user.type(screen.getByLabelText(/name/i), "PLAYERONE");
    await user.type(screen.getByLabelText(/room code/i), "WXYZ");
    await user.click(screen.getByRole("button", { name: /play/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Error message from API should be displayed
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to join room:",
        expect.any(Error)
      );
      expect(mockOnJoinSuccess).not.toHaveBeenCalled(); // Callback should not be called
    });
  });

  // Test Case 8: Form Submission - Network or generic fetch error
  test("displays generic error message on network or unexpected fetch error", async () => {
    const user = userEvent.setup();
    const mockOnJoinSuccess = vi.fn();
    const networkError = new Error("Network Down!");

    vi.spyOn(global, "fetch").mockRejectedValueOnce(networkError); // Simulate network error

    render(<HomeScreen onJoinSuccess={mockOnJoinSuccess} />);

    await user.type(screen.getByLabelText(/name/i), "PLAYERONE");
    await user.type(screen.getByLabelText(/room code/i), "WXYZ");
    await user.click(screen.getByRole("button", { name: /play/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Network Down!")).toBeInTheDocument(); // Generic error should be displayed
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to join room:",
        networkError
      );
      expect(mockOnJoinSuccess).not.toHaveBeenCalled(); // Callback should not be called
    });
  });

  // Test Case 9: "How to play" modal - Opens on click
  test('opens "How to play" modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    const howToPlayButton = screen.getByRole("button", {
      name: /how to play/i,
    });
    await user.click(howToPlayButton);

    // Modal content should be visible
    expect(
      screen.getByRole("heading", { name: /Hand & Brain – Rules/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Play in teams of two/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /got it/i })).toBeInTheDocument();
  });

  // Test Case 10: "How to play" modal - Closes on "Got it" click
  test('closes "How to play" modal when "Got it" button is clicked', async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    const howToPlayButton = screen.getByRole("button", {
      name: /how to play/i,
    });
    await user.click(howToPlayButton); // Open modal

    const gotItButton = screen.getByRole("button", { name: /got it/i });
    await user.click(gotItButton); // Close modal

    // Modal content should no longer be visible
    expect(
      screen.queryByRole("heading", { name: /Hand & Brain – Rules/i })
    ).not.toBeInTheDocument();
  });

  // Test Case 11: Edge case - Name input respects maxLength
  test("name input respects maxLength of 20", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);
    const nameInput = screen.getByLabelText(/name/i);

    const longName = "AveryLongNameThatExceedsTwentyCharacters";
    await user.type(nameInput, longName);
    expect(nameInput).toHaveValue(longName.substring(0, 20).toUpperCase());
  });

  // Test Case 12: Edge case - Room Code input respects maxLength
  test("room code input respects maxLength of 4", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);
    const roomCodeInput = screen.getByLabelText(/room code/i);

    await user.type(roomCodeInput, "ABCD123"); // 7 characters
    expect(roomCodeInput).toHaveValue("ABCD"); // Should only keep 4
  });
});
