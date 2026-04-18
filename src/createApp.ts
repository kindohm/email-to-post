import express, { type ErrorRequestHandler } from "express";
import { emailToPostHandler } from "./routes/emailToPost";

export const createApp = (): express.Express => {
  const app = express();

  app.use(express.json({ limit: "25mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/email-to-post", emailToPostHandler);

  app.all("/email-to-post", (req, res) => {
    console.warn("METHOD NOT ALLOWED", req.method);
    res.status(405).json({ error: "Method not allowed" });
  });

  const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    next(err);
  };

  app.use(jsonErrorHandler);

  return app;
};
