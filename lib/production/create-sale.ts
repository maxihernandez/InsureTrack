import "server-only";
import type { CreateSaleInput } from "./validation";
import { createSale } from "./repository";
type Actor = { id: string; role: string };
export async function executeCreateSale(actor: Actor, input: CreateSaleInput) {
  if (actor.role !== "manager" && actor.id !== input.agentId) return "inactive" as const;
  return await createSale(input) ? "saved" as const : "inactive" as const;
}