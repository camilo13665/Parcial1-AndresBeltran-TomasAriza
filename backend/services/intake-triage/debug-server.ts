import Fastify from "fastify";
import { z, ZodError } from "zod";

const app = Fastify({ logger: false });

app.post("/test", (req, reply) => {
  z.object({ a: z.string() }).parse(req.body);
  return reply.send({ ok: true });
});

app.setErrorHandler((err, req, reply) => {
  console.log("CUSTOM HANDLER FIRED", err instanceof ZodError, err.constructor.name);
  reply.status(400).send({ custom: true });
});

app.listen({ port: 3999, host: "0.0.0.0" });
