import "server-only";
import { isUuid } from "@/lib/validation";
import { removeAnnualGoal, removeGoal, saveAnnualGoal, saveGoal } from "./repository";
import type { SaveAnnualGoalInput, SaveGoalInput } from "./validation";
type Actor = { role: string };
export async function executeSaveGoal(actor: Actor, input: SaveGoalInput) { if (actor.role !== "manager") return "forbidden" as const; return await saveGoal(input) ? "saved" as const : "missing-product" as const; }
export async function executeRemoveGoal(actor: Actor, id: string) { if (actor.role !== "manager" || !isUuid(id)) return false; await removeGoal(id); return true; }
export async function executeSaveAnnualGoal(actor: Actor, input: SaveAnnualGoalInput) { if (actor.role !== "manager") return "forbidden" as const; return await saveAnnualGoal(input) ? "saved" as const : "missing-product" as const; }
export async function executeRemoveAnnualGoal(actor: Actor, id: string) { if (actor.role !== "manager" || !isUuid(id)) return false; await removeAnnualGoal(id); return true; }
