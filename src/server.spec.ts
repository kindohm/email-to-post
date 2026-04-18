import { startServer } from "./startServer";
import { main } from "./server";

jest.mock("./startServer", () => ({
  startServer: jest.fn(),
}));

describe("main", () => {
  it("starts the server", () => {
    main();

    expect(startServer).toHaveBeenCalledWith();
  });
});
