import "dotenv/config";
import app from "./app";
import { env } from "./config/env.js";

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
