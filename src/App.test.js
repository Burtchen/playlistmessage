import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the Spotify authorization call to action", async () => {
  render(<App />);
  expect(
    await screen.findByRole("button", { name: /authorize spotify to start/i }),
  ).toBeInTheDocument();
});
