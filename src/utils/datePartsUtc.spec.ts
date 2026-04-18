import { datePartsUtc } from "./datePartsUtc";

describe("datePartsUtc", () => {
  it("formats UTC date parts with padded month and day", () => {
    expect(datePartsUtc(new Date("2026-04-08T23:59:00.000Z"))).toEqual({
      yyyy: 2026,
      mm: "04",
      dd: "08",
    });
  });
});
