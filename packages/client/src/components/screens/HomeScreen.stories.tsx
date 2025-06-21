import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within } from "@storybook/test";

import HomeScreen from "./HomeScreen.js";

const meta: Meta<typeof HomeScreen> = {
  title: "Screens/HomeScreen",
  component: HomeScreen,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onJoinSuccess: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story for the initial state where the user chooses to create or join
export const InitialState: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole("button", { name: /Create New Room/i })
    ).toBeInTheDocument();
    expect(
      canvas.getByRole("button", { name: /Join Existing Room/i })
    ).toBeInTheDocument();
  },
};

// Story for the "Create New Room" flow
export const CreateRoomFlow: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const createButton = canvas.getByRole("button", {
      name: /Create New Room/i,
    });
    await userEvent.click(createButton);

    expect(canvas.getByLabelText(/name/i)).toBeInTheDocument();
    expect(
      canvas.getByRole("button", { name: /Create Room/i })
    ).toBeInTheDocument();
    expect(canvas.getByRole("button", { name: /Back/i })).toBeInTheDocument();
    expect(canvas.queryByLabelText(/room code/i)).not.toBeInTheDocument();
  },
};

// Story for the "Join Existing Room" flow
export const JoinRoomFlow: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const joinButton = canvas.getByRole("button", {
      name: /Join Existing Room/i,
    });
    await userEvent.click(joinButton);

    expect(canvas.getByLabelText(/name/i)).toBeInTheDocument();
    expect(canvas.getByLabelText(/room code/i)).toBeInTheDocument();
    expect(
      canvas.getByRole("button", { name: /Join Room/i })
    ).toBeInTheDocument();
    expect(canvas.getByRole("button", { name: /Back/i })).toBeInTheDocument();
  },
};

// Story demonstrating client-side validation for an empty name in join flow
export const JoinRoomEmptyNameError: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);

    // Go to Join flow
    const joinButton = canvas.getByRole("button", {
      name: /Join Existing Room/i,
    });
    await user.click(joinButton);

    // Attempt to submit with empty name
    const playButton = canvas.getByRole("button", { name: /Join Room/i });
    await user.click(playButton);

    expect(canvas.getByText(/A name is required./i)).toBeInTheDocument();
  },
};

// Story demonstrating client-side validation for an invalid room code in join flow
export const JoinRoomInvalidCodeError: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);

    // Go to Join flow
    const joinButton = canvas.getByRole("button", {
      name: /Join Existing Room/i,
    });
    await user.click(joinButton);

    // Type a name and invalid room code, then submit
    await user.type(canvas.getByLabelText(/name/i), "TESTER");
    await user.type(canvas.getByLabelText(/room code/i), "ABC"); // Invalid length

    const playButton = canvas.getByRole("button", { name: /Join Room/i });
    await user.click(playButton);

    expect(
      canvas.getByText(/Room code must be 4 letters./i)
    ).toBeInTheDocument();
  },
};

// Story demonstrating the "How to play" modal
export const HowToPlayModal: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);

    const howToPlayButton = canvas.getByRole("button", {
      name: /How to play/i,
    });
    await user.click(howToPlayButton);

    expect(
      canvas.getByRole("heading", { name: /Hand & Brain – Rules/i })
    ).toBeInTheDocument();
    const gotItButton = canvas.getByRole("button", { name: /Got it/i });
    await user.click(gotItButton);
    expect(
      canvas.queryByRole("heading", { name: /Hand & Brain – Rules/i })
    ).not.toBeInTheDocument();
  },
};
