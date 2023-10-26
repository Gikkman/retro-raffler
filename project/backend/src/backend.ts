import Fastify, { FastifyBaseLogger } from 'fastify';
import { fastifyStatic } from "@fastify/static";
import path from "path";

const fastify = Fastify({
  logger: {level: "info"}
});

export class Backend {
  log: FastifyBaseLogger;

  constructor() {
    this.log = fastify.log;
  }

  async start() {
    try {
      fastify.register(fastifyStatic, {root: path.join(__dirname, "..", "..", "frontend")});
      const state = await fastify.listen({ port: 8080 });
      this.log.info(state);
    }
    catch (err) {
      this.log.error(err);
      process.exit(1);
    }
  }
}
