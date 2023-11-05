import Fastify, { FastifyBaseLogger } from 'fastify';
import { fastifyStatic } from "@fastify/static";
import path from "path";

import { all, create, insert } from './db';

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

      fastify.post("/create", (req, res) => {
        create();
        res.send("OK");
      } );

      fastify.post("/insert", (req, res) => {
        insert();
        res.send("OK");
      } );

      fastify.get("/all", (req, res) => {
        res.send(all());
      });

      const state = await fastify.listen({ port: 8080 });
      this.log.info(state);
    }
    catch (err) {
      this.log.error(err);
      process.exit(1);
    }
  }
}
