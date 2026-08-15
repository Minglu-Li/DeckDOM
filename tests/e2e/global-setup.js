import { createServer } from "vite";
import { TEST_SERVER_PORT } from "./test-server.js";

export default async function startEditorServer() {
  const server = await createServer({
    logLevel: "warn",
    server: {
      host: "127.0.0.1",
      port: TEST_SERVER_PORT,
      strictPort: true,
    },
  });

  await server.listen();

  return async () => {
    await server.close();
  };
}
