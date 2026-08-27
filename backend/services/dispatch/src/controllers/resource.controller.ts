import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateResourceSchema, ListResourcesQuerySchema, UpdateResourceStatusSchema } from "../schemas/dispatch.schema";
import { resourceService } from "../services/dispatch.service";

export async function createResource(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateResourceSchema.parse(request.body);
  const resource = await resourceService.create(input);
  return reply.status(201).send(resource);
}

export async function listResources(request: FastifyRequest, reply: FastifyReply) {
  const filters = ListResourcesQuerySchema.parse(request.query);
  const items = await resourceService.list(filters);
  return reply.status(200).send({ data: items, total: items.length });
}

export async function getResource(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const resource = await resourceService.getById(request.params.id);
  return reply.status(200).send(resource);
}

export async function updateResourceStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { estado } = UpdateResourceStatusSchema.parse(request.body);
  const resource = await resourceService.updateStatus(request.params.id, estado);
  return reply.status(200).send(resource);
}

export async function getResourceStats(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send(await resourceService.stats());
}
