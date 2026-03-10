"use client";

import { CalendarDays, UserCircle } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createTicketAction } from "@/app/actions";
import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
const USER_ID_STORAGE_KEY = "basketball-board:user-id";

// 06:00 ~ 23:30, 30분 간격 (총 36개)
const MEAL_PRESETS = {
  lunch:  { startIdx: 14, endIdx: 16 }, // 13:00 / 14:00
  dinner: { startIdx: 26, endIdx: 28 }, // 19:00 / 20:00
} as const;
type MealType = keyof typeof MEAL_PRESETS;

// 06:00 ~ 23:30, 30분 간격 (총 36개)
const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function TimeStepper({
  label, idx, onChange, options,
}: {
  label: string; idx: number; onChange: (i: number) => void; options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, idx - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-base font-bold text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-transparent"
        >
          −
        </button>
        <div className="min-w-[4.5rem] rounded-full bg-primary px-4 py-1 text-center text-sm font-semibold text-primary-foreground shadow">
          {options[idx]}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(options.length - 1, idx + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-base font-bold text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-transparent"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function BoardClient({
  weekDates,
  initialTicketsByDate
}: BoardClientProps) {
  const [selectedDate, setSelectedDate] = useState(weekDates[0]?.value ?? "");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [startIdx, setStartIdx] = useState(MEAL_PRESETS.lunch.startIdx); // 13:00
  const [endIdx, setEndIdx]     = useState(MEAL_PRESETS.lunch.endIdx);   // 14:00
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [ticketsByDate, setTicketsByDate] = useState(initialTicketsByDate);
  const [actionState, formAction, isPending] = useActionState(
    createTicketAction,
    EMPTY_ACTION_STATE
  );

  useEffect(() => {
    const storedNickname = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    const storedUserId = window.localStorage.getItem(USER_ID_STORAGE_KEY);

    if (storedNickname) {
      setNickname(storedNickname);
    }

    if (storedUserId) {
      setUserId(storedUserId);
      return;
    }

    const nextUserId = crypto.randomUUID();
    window.localStorage.setItem(USER_ID_STORAGE_KEY, nextUserId);
    setUserId(nextUserId);
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

  function handleMealToggle(next: MealType) {
    setMeal(next);
    setStartIdx(MEAL_PRESETS[next].startIdx);
    setEndIdx(MEAL_PRESETS[next].endIdx);
  }

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="relative flex items-start justify-between gap-4">
        {/* 왼쪽: 브랜딩 */}
        <div>
          <p className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Jungle Basketball
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            이번 주 농구 시간, 여기서 올리고 바로 같이 해요.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            원하는 시간대를 올리거나 이미
            올라온 일정에 참여해 인원을 모으세요.
          </p>
        </div>

        {/* 오른쪽: 닉네임 버튼 + 플로팅 패널 */}
        <div className="relative shrink-0">
          <button
            onClick={() => setNicknameOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold transition hover:border-primary/40"
          >
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            {nickname.trim() ? nickname.trim() : "닉네임 설정"}
          </button>

          {nicknameOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNicknameOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  닉네임
                </p>
                <Input
                  autoFocus
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 12-20"
                  maxLength={20}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  기수와 번호를 입력하세요 <br></br>로그인 없이 이 닉네임으로 생성과 참여가 처리됩니다.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 7-day grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Weekly board
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pt-2 sm:-mx-6 sm:px-6">
          <div className="grid min-w-[700px] grid-cols-7 gap-2">
            {weekDates.map((dateItem) => {
              const isSelected = dateItem.value === selectedDate;
              const isToday = dateItem.value === today;
              const tickets = ticketsByDate[dateItem.value] ?? [];

              return (
                <div key={dateItem.value} className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedDate(dateItem.value)}
                    className={cn(
                      "w-full rounded-xl px-2 py-2 text-center transition",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 border border-border transition-all hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-lg hover:border-transparent"
                    )}
                  >
                    <span className="block text-[10px] uppercase tracking-widest opacity-60">
                      {isToday ? "today" : dateItem.weekdayLabel}
                    </span>
                    <span className="block text-sm font-bold">{dateItem.dayLabel}</span>
                  </button>

                  <div className="flex flex-col gap-2">
                    {tickets.length > 0 ? (
                      tickets.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          currentUser={{
                            userId,
                            nickname
                          }}
                          compact
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-3 text-center">
                        <p className="text-[10px] text-muted-foreground">없음</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Create ticket form (bottom) */}
      <section>
        <Card>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Create ticket
              </p>
              <h2 className="mt-2 text-2xl font-bold">일정 올리기</h2>
            </div>

            <form action={formAction}>
              <input type="hidden" name="date" value={selectedDate} />
              <input type="hidden" name="creator" value={nickname.trim()} />
              <input type="hidden" name="creatorUserId" value={userId} />

              <div className="flex flex-col gap-3">
                {/* 날짜 pills */}
                <div className="flex flex-wrap gap-1.5">
                  {weekDates.map((dateItem) => {
                    const isSelected = dateItem.value === selectedDate;
                    const isToday = dateItem.value === today;
                    return (
                      <button
                        key={dateItem.value}
                        type="button"
                        onClick={() => setSelectedDate(dateItem.value)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 hover:shadow-lg hover:border-transparent"
                        )}
                      >
                        {isToday ? "오늘" : dateItem.weekdayLabel} {dateItem.dayLabel}
                      </button>
                    );
                  })}
                </div>

                {/* 점심 / 저녁 토글 */}
                <div className="flex shrink-0 items-center rounded-full border border-border bg-muted p-0.5 w-fit">
                  {(["lunch", "dinner"] as MealType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMealToggle(m)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                        meal === m
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m === "lunch" ? "점심" : "저녁"}
                    </button>
                  ))}
                </div>

                {/* 시간 steppers */}
                <div className="flex items-end gap-3">
                  <input type="hidden" name="startTime" value={TIME_OPTIONS[startIdx]} />
                  <input type="hidden" name="endTime"   value={TIME_OPTIONS[endIdx]} />
                  <TimeStepper label="시작" idx={startIdx} onChange={setStartIdx} options={TIME_OPTIONS} />
                  <TimeStepper label="종료" idx={endIdx}   onChange={setEndIdx}   options={TIME_OPTIONS} />
                </div>

                {/* 제출 */}
                <Button type="submit" className="shrink-0 w-fit" disabled={isPending}>
                  {isPending ? "등록 중..." : "일정 올리기"}
                </Button>
              </div>

              {actionState && !actionState.ok ? (
                <p className="mt-2 text-sm text-red-400">{actionState.message}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
