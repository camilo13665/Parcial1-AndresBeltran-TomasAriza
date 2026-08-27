import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateDispatchSchema, ReleaseResourcesSchema } from "../schemas/dispatch.schema";
import { dispatchService } from "../services/dispatch.service";

export async function createDispatch(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateDispatchSchema.parse(request.body);
  const { dispatch, sincronizacionIntake } = await dispatchService.create(input, request.headers.authorization);
  return reply.status(201).send({ ...dispatch, sincronizacionIntake });
}

export async function listDispatches(request: FastifyRequest<{ Querystring: { emergenciaId?: string } }>, reply: FastifyReply) {
  const items = await dispatchService.list(request.query.emergenciaId);
  return reply.status(200).send({ data: items, total: items.length });
}

export async function getDispatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const dispatch = await dispatchService.getById(request.params.id);
  return reply.status(200).send(dispatch);
}

export async function releaseResources(request: FastifyRequest, reply: FastifyReply) {
  const { emergenciaId } = ReleaseResourcesSchema.parse(request.body);
  const result = await dispatchService.releaseByEmergency(emergenciaId);
  return reply.status(200).send(result);
}
