"use server";

import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";
import { getDateKey, isValidDateKey } from "@/lib/calendar";
import type { Participant, Ticket } from "@/lib/types";

const TICKETS_KEY_PREFIX = "tickets";
const hasKvEnv =
  Boolean(process.env.KV_REST_API_URL) && Boolean(process.env.KV_REST_API_TOKEN);

function getTicketsKey(date: string) {
  return `${TICKETS_KEY_PREFIX}:${date}`;
}

function normalizeNickname(value: string) {
  return value.trim();
}

function normalizeUserId(value: string) {
  return value.trim();
}

function normalizeParticipants(rawParticipants: unknown): Participant[] {
  if (!Array.isArray(rawParticipants)) {
    return [];
  }

  return rawParticipants.flatMap((participant, index) => {
    if (typeof participant === "string") {
      const nickname = normalizeNickname(participant);

      if (!nickname) {
        return [];
      }

      return [
        {
          userId: `legacy:${nickname}:${index}`,
          nickname
        }
      ];
    }

    if (
      participant &&
      typeof participant === "object" &&
      "userId" in participant &&
      "nickname" in participant
    ) {
      const userId = normalizeUserId(String(participant.userId));
      const nickname = normalizeNickname(String(participant.nickname));

      if (!userId || !nickname) {
        return [];
      }

      return [{ userId, nickname }];
    }

    return [];
  });
}

function normalizeTicket(rawTicket: Ticket): Ticket {
  return {
    ...rawTicket,
    participants: normalizeParticipants(rawTicket.participants)
  };
}

function validateTicketInput(input: {
  date: string;
  startTime: string;
  endTime: string;
  creator: string;
  creatorUserId: string;
}) {
  const creator = normalizeNickname(input.creator);
  const creatorUserId = normalizeUserId(input.creatorUserId);

  if (!isValidDateKey(input.date)) {
    throw new Error("날짜 형식이 올바르지 않습니다.");
  }

  if (!creator) {
    throw new Error("닉네임을 입력해주세요.");
  }

  if (!creatorUserId) {
    throw new Error("사용자 정보가 없습니다. 브라우저를 새로고침해주세요.");
  }

  if (!input.startTime || !input.endTime) {
    throw new Error("시간을 모두 입력해주세요.");
  }

  if (input.startTime >= input.endTime) {
    throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");
  }

  return {
    ...input,
    creator,
    creatorUserId
  };
}

export async function getTicketsByDate(date: string) {
  if (!isValidDateKey(date) || !hasKvEnv) {
    return [];
  }

  try {
    const tickets = await kv.get<Ticket[]>(getTicketsKey(date));
    return (tickets ?? [])
      .map(normalizeTicket)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch {
    return [];
  }
}

export async function createTicket(input: {
  date: string;
  startTime: string;
  endTime: string;
  creator: string;
  creatorUserId: string;
}) {
  if (!hasKvEnv) {
    throw new Error("Vercel KV 환경변수가 설정되지 않았습니다.");
  }

  const validated = validateTicketInput(input);
  const tickets = await getTicketsByDate(validated.date);

  const ticket: Ticket = {
    id: randomUUID(),
    date: validated.date,
    startTime: validated.startTime,
    endTime: validated.endTime,
    creator: validated.creator,
    participants: [
      {
        userId: validated.creatorUserId,
        nickname: validated.creator
      }
    ]
  };

  const updatedTickets = [...tickets, ticket].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  try {
    await kv.set(getTicketsKey(validated.date), updatedTickets);
  } catch {
    throw new Error("저장소에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
  }

  return ticket;
}

export async function toggleTicketParticipation(input: {
  date: string;
  ticketId: string;
  userId: string;
  nickname: string;
}) {
  if (!hasKvEnv) {
    throw new Error("Vercel KV 환경변수가 설정되지 않았습니다.");
  }

  const nickname = normalizeNickname(input.nickname);
  const userId = normalizeUserId(input.userId);

  if (!isValidDateKey(input.date)) {
    throw new Error("날짜 형식이 올바르지 않습니다.");
  }

  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  if (!userId) {
    throw new Error("사용자 정보가 없습니다. 브라우저를 새로고침해주세요.");
  }

  const tickets = await getTicketsByDate(input.date);
  const ticketIndex = tickets.findIndex((ticket) => ticket.id === input.ticketId);

  if (ticketIndex === -1) {
    throw new Error("티켓을 찾을 수 없습니다.");
  }

  const ticket = tickets[ticketIndex];
  const hasJoined = ticket.participants.some(
    (participant) => participant.userId === userId
  );

  const updatedTicket: Ticket = {
    ...ticket,
    participants: hasJoined
      ? ticket.participants.filter((participant) => participant.userId !== userId)
      : [...ticket.participants, { userId, nickname }]
  };

  const updatedTickets = tickets.map((currentTicket) =>
    currentTicket.id === input.ticketId ? updatedTicket : currentTicket
  );

  try {
    await kv.set(getTicketsKey(input.date), updatedTickets);
  } catch {
    throw new Error("저장소에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
  }

  return updatedTicket;
}

export async function cleanupPastTicketKeys(todayDate = getDateKey(new Date())) {
  if (!hasKvEnv) {
    return { deletedKeys: 0, deletedDates: [] as string[] };
  }

  let keys: string[];

  try {
    keys = await kv.keys(`${TICKETS_KEY_PREFIX}:*`);
  } catch {
    return { deletedKeys: 0, deletedDates: [] as string[] };
  }

  const expiredKeys = keys.filter((key) => {
    const date = key.slice(`${TICKETS_KEY_PREFIX}:`.length);
    return isValidDateKey(date) && date < todayDate;
  });

  if (expiredKeys.length === 0) {
    return { deletedKeys: 0, deletedDates: [] as string[] };
  }

  try {
    await kv.del(...expiredKeys);
  } catch {
    return { deletedKeys: 0, deletedDates: [] as string[] };
  }

  return {
    deletedKeys: expiredKeys.length,
    deletedDates: expiredKeys.map((key) => key.slice(`${TICKETS_KEY_PREFIX}:`.length))
  };
}
