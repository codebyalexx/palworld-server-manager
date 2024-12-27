const express = require("express");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const runPostServerScript = () => {
  console.log("Running post server-side script...");
};

const runServerScript = () => {
  console.log("Running server-side script...");
};

app.prepare().then(() => {
  const server = express();

  runServerScript();

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  const port = 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    runPostServerScript();
  });
});
