import "dotenv/config";
import { startServer } from "./startServer";

export const main = (): void => {
  startServer();
};

if (require.main === module) {
  main();
}
