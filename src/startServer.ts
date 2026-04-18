import type { Server } from "node:http";
import { createApp } from "./createApp";

export const startServer = (): Server => {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  return app.listen(port, () => {
    console.log(`email-to-post server listening on ${port}`);
  });
};
