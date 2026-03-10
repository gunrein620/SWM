"use client";

import { CalendarDays, Plus } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createTicketAction } from "@/app/actions";
import { TicketCard } from "@/components/TicketCard";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActionState, Ticket } from "@/lib/types";

type DayItem = {
  value: string;
  weekdayLabel: string;
  dayLabel: string;
};

type BoardClientProps = {
  weekDates: DayItem[];
  initialTicketsByDate: Record<string, Ticket[]>;
};

const EMPTY_ACTION_STATE: ActionState<Ticket> | null = null;
const NICKNAME_STORAGE_KEY = "basketball-board:nickname";

export function BoardClient({
  weekDates,
  initialTicketsByDate
}: BoardClientProps) {
  const [selectedDate, setSelectedDate] = useState(weekDates[0]?.value ?? "");
  const [nickname, setNickname] = useState("");
  const [ticketsByDate, setTicketsByDate] = useState(initialTicketsByDate);
  const [actionState, formAction, isPending] = useActionState(
    createTicketAction,
    EMPTY_ACTION_STATE
  );

  useEffect(() => {
    const storedNickname = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    if (storedNickname) {
      setNickname(storedNickname);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
  }, [nickname]);

  useEffect(() => {
    if (!actionState?.ok) {
      return;
    }

    setTicketsByDate((current) => {
      const currentTickets = current[actionState.data.date] ?? [];
      const nextTickets = [...currentTickets, actionState.data].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      return {
        ...current,
        [actionState.data.date]: nextTickets
      };
    });
  }, [actionState]);

  const selectedTickets = useMemo(
    () => ticketsByDate[selectedDate] ?? [],
    [selectedDate, ticketsByDate]
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none bg-transparent shadow-none">
          <CardContent className="px-0 pb-0 pt-2">
            <p className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground shadow-sm">
              Dorm Basketball
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              이번 주 농구 시간, 여기서 올리고 바로 같이 모읍니다.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              단일 코트 기준 공용 게시판입니다. 원하는 시간대를 올리거나 이미
              올라온 일정에 참여해 인원을 모으세요.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/92">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Plus className="h-4 w-4" />
              닉네임
            </div>
            <Input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="예: 민수"
              maxLength={20}
            />
            <p className="text-sm text-muted-foreground">
              로그인 없이 이 닉네임으로 생성과 참여가 처리됩니다.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Weekly board
        </div>
        <WeeklyCalendar
          dates={weekDates}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/92">
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Create ticket
              </p>
              <h2 className="mt-2 text-2xl font-bold">이 시간에 농구할래요</h2>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="date" value={selectedDate} />
              <input type="hidden" name="creator" value={nickname.trim()} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  시작 시간
                  <Input name="startTime" type="time" required />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  종료 시간
                  <Input name="endTime" type="time" required />
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "등록 중..." : "일정 올리기"}
              </Button>

              {actionState && !actionState.ok ? (
                <p className="text-sm text-red-600">{actionState.message}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Tickets
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {weekDates.find((dateItem) => dateItem.value === selectedDate)?.dayLabel}
              </h2>
            </div>
            <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm">
              {selectedTickets.length}개 일정
            </p>
          </div>

          {selectedTickets.length > 0 ? (
            <div className="space-y-4">
              {selectedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} nickname={nickname} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-white/65">
              <CardContent className="py-10 text-center">
                <p className="text-lg font-semibold">아직 올라온 일정이 없습니다.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  먼저 시간을 올려서 같이 농구할 사람을 모아보세요.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
