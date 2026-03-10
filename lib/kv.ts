"use server";

import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";
import { isValidDateKey } from "@/lib/calendar";
import type { Ticket } from "@/lib/types";

const TICKETS_KEY_PREFIX = "tickets";
const hasKvEnv =
  Boolean(process.env.KV_REST_API_URL) && Boolean(process.env.KV_REST_API_TOKEN);

function getTicketsKey(date: string) {
  return `${TICKETS_KEY_PREFIX}:${date}`;
}

function normalizeNickname(value: string) {
  return value.trim();
}

function validateTicketInput(input: {
  date: string;
  startTime: string;
  endTime: string;
  creator: string;
}) {
  const creator = normalizeNickname(input.creator);

  if (!isValidDateKey(input.date)) {
    throw new Error("날짜 형식이 올바르지 않습니다.");
  }

  if (!creator) {
    throw new Error("닉네임을 입력해주세요.");
  }

  if (!input.startTime || !input.endTime) {
    throw new Error("시간을 모두 입력해주세요.");
  }

  if (input.startTime >= input.endTime) {
    throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");
  }

  return {
    ...input,
    creator
  };
}

export async function getTicketsByDate(date: string) {
  if (!isValidDateKey(date) || !hasKvEnv) {
    return [];
  }

  const tickets = await kv.get<Ticket[]>(getTicketsKey(date));
  return (tickets ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function createTicket(input: {
  date: string;
  startTime: string;
  endTime: string;
  creator: string;
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
    participants: [validated.creator]
  };

  const updatedTickets = [...tickets, ticket].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  await kv.set(getTicketsKey(validated.date), updatedTickets);

  return ticket;
}

export async function toggleTicketParticipation(input: {
  date: string;
  ticketId: string;
  nickname: string;
}) {
  if (!hasKvEnv) {
    throw new Error("Vercel KV 환경변수가 설정되지 않았습니다.");
  }

  const nickname = normalizeNickname(input.nickname);

  if (!isValidDateKey(input.date)) {
    throw new Error("날짜 형식이 올바르지 않습니다.");
  }

  if (!nickname) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const tickets = await getTicketsByDate(input.date);
  const ticketIndex = tickets.findIndex((ticket) => ticket.id === input.ticketId);

  if (ticketIndex === -1) {
    throw new Error("티켓을 찾을 수 없습니다.");
  }

  const ticket = tickets[ticketIndex];
  const hasJoined = ticket.participants.includes(nickname);

  const updatedTicket: Ticket = {
    ...ticket,
    participants: hasJoined
      ? ticket.participants.filter((participant) => participant !== nickname)
      : [...ticket.participants, nickname]
  };

  const updatedTickets = tickets.map((currentTicket) =>
    currentTicket.id === input.ticketId ? updatedTicket : currentTicket
  );

  await kv.set(getTicketsKey(input.date), updatedTickets);

  return updatedTicket;
}
