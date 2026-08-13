import { createServer } from "vite";

export const EDITOR_E2E_PORT = 4400;

export default async function startEditorServer() {
  const server = await createServer({
    logLevel: "warn",
    server: {
      host: "127.0.0.1",
      port: EDITOR_E2E_PORT,
      strictPort: true,
    },
  });

  await server.listen();

  return async () => {
    await server.close();
  };
}
