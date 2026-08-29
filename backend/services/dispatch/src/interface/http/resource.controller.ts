import type { FastifyReply, FastifyRequest } from "fastify";
import { container } from "../../composition/container";
import {
  CreateResourceSchema,
  ListResourcesQuerySchema,
  NearbyResourcesQuerySchema,
  UpdateResourceStatusSchema,
} from "../dto/dispatch.schema";

export async function createResource(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateResourceSchema.parse(request.body);
  const resource = await container.createResourceUseCase.execute(input);
  return reply.status(201).send(resource);
}

export async function listResources(request: FastifyRequest, reply: FastifyReply) {
  const filters = ListResourcesQuerySchema.parse(request.query);
  const items = await container.listResourcesUseCase.execute(filters);
  return reply.status(200).send({ data: items, total: items.length });
}

export async function getResource(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const resource = await container.getResourceUseCase.execute(request.params.id);
  return reply.status(200).send(resource);
}

export async function updateResourceStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { estado } = UpdateResourceStatusSchema.parse(request.body);
  const resource = await container.updateResourceStatusUseCase.execute(request.params.id, estado);
  return reply.status(200).send(resource);
}

export async function getResourceStats(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send(await container.getResourceStatsUseCase.execute());
}

/** Proximidad real (PostGIS): recursos dentro de un radio de un punto, ordenados por distancia. */
export async function getNearbyResources(request: FastifyRequest, reply: FastifyReply) {
  const query = NearbyResourcesQuerySchema.parse(request.query);
  const items = await container.findNearbyResourcesUseCase.execute(query);
  return reply.status(200).send({ data: items, total: items.length });
}
