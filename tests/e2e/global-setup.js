import { createServer } from "vite";

export default async function startEditorServer() {
  const server = await createServer({
    logLevel: "warn",
    server: {
      host: "127.0.0.1",
      port: 4391,
      strictPort: true,
    },
  });

  await server.listen();

  return async () => {
    await server.close();
  };
}
