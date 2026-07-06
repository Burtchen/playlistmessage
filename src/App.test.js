import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the Spotify authorization call to action", () => {
  render(<App />);
  expect(
    screen.getByRole("button", { name: /authorize spotify to start/i })
  ).toBeInTheDocument();
});
