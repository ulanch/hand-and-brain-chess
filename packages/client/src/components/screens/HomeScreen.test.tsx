import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import HomeScreen from "./HomeScreen.js";
import { vi } from "vitest";

const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("HomeScreen", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Initial screen renders correctly
  test("renders the main elements of the home screen", () => {
    render(<HomeScreen onJoinSuccess={() => {}} />);

    expect(screen.getByAltText("Hand & Brain Logo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Hand and Brain Chess/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create New Room/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Join Existing Room/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /how to play/i })
    ).toBeInTheDocument();
  });

  // Test Case 2: Clicking "Create New Room" shows the name input
  test('clicking "Create New Room" shows name input and submit button', async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Create New Room/i }));

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/room code/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Room/i })
    ).toBeInTheDocument();
  });

  // Test Case 3: Clicking "Join Existing Room" shows name + room code inputs
  test('clicking "Join Existing Room" shows name and room code inputs', async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Join Room/i })
    ).toBeInTheDocument();
  });

  // Test Case 4: Name input converts to uppercase, strips non-alpha/space chars
  test("name input converts to uppercase and removes invalid characters", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Create New Room/i }));
    const nameInput = screen.getByLabelText(/name/i);

    await user.type(nameInput, "john doe123!");
    expect(nameInput).toHaveValue("JOHN DOE");
  });

  // Test Case 5: Room code input converts to uppercase, strips non-alpha chars
  test("room code input converts to uppercase and removes invalid characters", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );
    const roomCodeInput = screen.getByLabelText(/room code/i);

    await user.type(roomCodeInput, "abcD123!");
    expect(roomCodeInput).toHaveValue("ABCD");
  });

  // Test Case 6: Validation — empty name
  test("displays error for empty name on submission", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Create New Room/i }));
    await user.click(screen.getByRole("button", { name: /Create Room/i }));

    expect(screen.getByText(/a name is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  // Test Case 7: Validation — invalid room code in join mode
  test("displays error for invalid room code on submission", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );
    await user.type(screen.getByLabelText(/name/i), "PLAYERONE");
    await user.type(screen.getByLabelText(/room code/i), "ABC");
    await user.click(screen.getByRole("button", { name: /Join Room/i }));

    expect(
      screen.getByText(/room code must be 4 letters/i)
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  // Test Case 8: Successful room creation
  test("calls API and onJoinSuccess on successful room creation", async () => {
    const user = userEvent.setup();
    const mockOnJoinSuccess = vi.fn();
    const mockRoomData = {
      room: { id: "ROOM123", code: "ABCD" },
      player: { id: "PLAYER1", name: "TESTER" },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoomData),
    } as Response);

    render(<HomeScreen onJoinSuccess={mockOnJoinSuccess} />);

    await user.click(screen.getByRole("button", { name: /Create New Room/i }));
    await user.type(screen.getByLabelText(/name/i), "TESTER");
    await user.click(screen.getByRole("button", { name: /Create Room/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/rooms/create",
        expect.objectContaining({ method: "POST" })
      );
      expect(mockOnJoinSuccess).toHaveBeenCalledWith(
        mockRoomData.room,
        mockRoomData.player
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Successfully joined room:",
        mockRoomData
      );
    });
  });

  // Test Case 9: Successful room join
  test("calls API and onJoinSuccess on successful room join", async () => {
    const user = userEvent.setup();
    const mockOnJoinSuccess = vi.fn();
    const mockRoomData = {
      room: { id: "ROOM123", code: "ABCD" },
      player: { id: "PLAYER1", name: "TESTER" },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoomData),
    } as Response);

    render(<HomeScreen onJoinSuccess={mockOnJoinSuccess} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );
    await user.type(screen.getByLabelText(/name/i), "TESTER");
    await user.type(screen.getByLabelText(/room code/i), "ABCD");
    await user.click(screen.getByRole("button", { name: /Join Room/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/rooms/join",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "TESTER", roomCode: "ABCD" }),
        })
      );
      expect(mockOnJoinSuccess).toHaveBeenCalledWith(
        mockRoomData.room,
        mockRoomData.player
      );
    });
  });

  // Test Case 10: API error response
  test("displays API error message on unsuccessful submission", async () => {
    const user = userEvent.setup();
    const mockOnJoinSuccess = vi.fn();
    const errorMessage = "Room not found or full.";

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    } as Response);

    render(<HomeScreen onJoinSuccess={mockOnJoinSuccess} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );
    await user.type(screen.getByLabelText(/name/i), "TESTER");
    await user.type(screen.getByLabelText(/room code/i), "WXYZ");
    await user.click(screen.getByRole("button", { name: /Join Room/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to join room:",
        expect.any(Error)
      );
      expect(mockOnJoinSuccess).not.toHaveBeenCalled();
    });
  });

  // Test Case 11: Network error
  test("displays generic error message on network failure", async () => {
    const user = userEvent.setup();
    const networkError = new Error("Network Down!");
    vi.spyOn(global, "fetch").mockRejectedValueOnce(networkError);

    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );
    await user.type(screen.getByLabelText(/name/i), "TESTER");
    await user.type(screen.getByLabelText(/room code/i), "WXYZ");
    await user.click(screen.getByRole("button", { name: /Join Room/i }));

    await waitFor(() => {
      expect(screen.getByText("Network Down!")).toBeInTheDocument();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to join room:",
        networkError
      );
    });
  });

  // Test Case 12: "How to play" modal opens and closes
  test('"How to play" modal opens and closes', async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: /how to play/i }));
    expect(
      screen.getByRole("heading", { name: /Hand & Brain – Rules/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /got it/i }));
    expect(
      screen.queryByRole("heading", { name: /Hand & Brain – Rules/i })
    ).not.toBeInTheDocument();
  });

  // Test Case 13: Back button resets to initial mode
  test('"Back" button resets to initial mode', async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Create New Room/i }));
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create New Room/i })
    ).toBeInTheDocument();
  });

  // Test Case 14: Name input respects maxLength of 20
  test("name input respects maxLength of 20", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: /Create New Room/i }));
    const nameInput = screen.getByLabelText(/name/i);

    await user.type(nameInput, "AveryLongNameThatExceedsTwentyCharacters");
    expect(nameInput).toHaveValue("AVERYLONGNAMETHATEXCE".substring(0, 20));
  });

  // Test Case 15: Room code input respects maxLength of 4
  test("room code input respects maxLength of 4", async () => {
    const user = userEvent.setup();
    render(<HomeScreen onJoinSuccess={() => {}} />);

    await user.click(
      screen.getByRole("button", { name: /Join Existing Room/i })
    );
    const roomCodeInput = screen.getByLabelText(/room code/i);

    await user.type(roomCodeInput, "ABCDE");
    expect(roomCodeInput).toHaveValue("ABCD");
  });
});
