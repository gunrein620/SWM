"use server";

import { revalidatePath } from "next/cache";
import {
  createTicket as createTicketRecord,
  toggleTicketParticipation
} from "@/lib/kv";
import type { ActionState, Ticket } from "@/lib/types";

export async function createTicketAction(
  _: ActionState<Ticket> | null,
  formData: FormData
): Promise<ActionState<Ticket>> {
  try {
    const ticket = await createTicketRecord({
      date: String(formData.get("date") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
      creator: String(formData.get("creator") ?? ""),
      creatorUserId: String(formData.get("creatorUserId") ?? "")
    });

    revalidatePath("/");
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "티켓 생성 중 오류가 발생했습니다."
    };
  }
}

export async function toggleParticipationAction(input: {
  date: string;
  ticketId: string;
  userId: string;
  nickname: string;
}): Promise<ActionState<Ticket>> {
  try {
    const ticket = await toggleTicketParticipation(input);
    revalidatePath("/");
    return { ok: true, data: ticket };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "참여 처리 중 오류가 발생했습니다."
    };
  }
}
