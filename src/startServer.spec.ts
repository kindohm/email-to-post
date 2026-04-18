import { createApp } from "./createApp";
import { startServer } from "./startServer";

jest.mock("./createApp", () => ({
  createApp: jest.fn(),
}));

describe("startServer", () => {
  const listen = jest.fn();
  const server = { close: jest.fn() };

  beforeEach(() => {
    process.env.PORT = "4321";
    listen.mockImplementation((_port, callback) => {
      callback();
      return server;
    });
    jest.mocked(createApp).mockReturnValue({ listen } as never);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.PORT;
    jest.restoreAllMocks();
  });

  it("creates the app and starts listening on the configured port", () => {
    expect(startServer()).toBe(server);
    expect(createApp).toHaveBeenCalledWith();
    expect(listen).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(console.log).toHaveBeenCalledWith("email-to-post server listening on 4321");
  });
});
