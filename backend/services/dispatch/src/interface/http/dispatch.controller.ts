import type { FastifyReply, FastifyRequest } from "fastify";
import { container } from "../../composition/container";
import { CreateDispatchSchema, ReleaseResourcesSchema } from "../dto/dispatch.schema";

export async function createDispatch(request: FastifyRequest, reply: FastifyReply) {
  const input = CreateDispatchSchema.parse(request.body);
  const { dispatch, sincronizacionIntake } = await container.createDispatchUseCase.execute(
    input,
    request.headers.authorization,
  );
  return reply.status(201).send({ ...dispatch, sincronizacionIntake });
}

export async function listDispatches(
  request: FastifyRequest<{ Querystring: { emergenciaId?: string } }>,
  reply: FastifyReply,
) {
  const items = await container.listDispatchesUseCase.execute(request.query.emergenciaId);
  return reply.status(200).send({ data: items, total: items.length });
}

export async function getDispatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const dispatch = await container.getDispatchUseCase.execute(request.params.id);
  return reply.status(200).send(dispatch);
}

export async function releaseResources(request: FastifyRequest, reply: FastifyReply) {
  const { emergenciaId } = ReleaseResourcesSchema.parse(request.body);
  const result = await container.releaseResourcesByEmergencyUseCase.execute(emergenciaId);
  return reply.status(200).send(result);
}
