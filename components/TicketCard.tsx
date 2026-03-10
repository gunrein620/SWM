"use client";

import { LoaderCircle, Users } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toggleParticipationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Participant, Ticket } from "@/lib/types";

type TicketCardProps = {
  ticket: Ticket;
  currentUser: Participant;
  compact?: boolean;
};

export function TicketCard({ ticket, currentUser, compact }: TicketCardProps) {
  const [serverTicket, setServerTicket] = useState(ticket);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticTicket, updateOptimisticTicket] = useOptimistic(
    serverTicket,
    (currentTicket: Ticket, nextParticipant: Participant) => {
      const joined = currentTicket.participants.some(
        (participant) => participant.userId === nextParticipant.userId
      );

      return {
        ...currentTicket,
        participants: joined
          ? currentTicket.participants.filter(
              (participant) => participant.userId !== nextParticipant.userId
            )
          : [...currentTicket.participants, nextParticipant]
      };
    }
  );

  const hasJoined = optimisticTicket.participants.some(
    (participant) => participant.userId === currentUser.userId
  );

  function handleJoin() {
    const trimmedNickname = currentUser.nickname.trim();
    const trimmedUserId = currentUser.userId.trim();

    if (!trimmedNickname) {
      setError("먼저 닉네임을 입력해주세요.");
      return;
    }

    if (!trimmedUserId) {
      setError("사용자 정보가 없습니다. 브라우저를 새로고침해주세요.");
      return;
    }

    setError(null);
    updateOptimisticTicket({
      userId: trimmedUserId,
      nickname: trimmedNickname
    });

    startTransition(async () => {
      const result = await toggleParticipationAction({
        date: serverTicket.date,
        ticketId: serverTicket.id,
        userId: trimmedUserId,
        nickname: trimmedNickname
      });

      if (!result.ok) {
        setError(result.message);
        setServerTicket((currentTicket) => ({ ...currentTicket }));
        return;
      }

      setServerTicket(result.data);
    });
  }

  if (compact) {
    const startTime = optimisticTicket.startTime;
    const endTime = optimisticTicket.endTime;
    const creator = optimisticTicket.creator;
    const participants = optimisticTicket.participants;
    const count = participants.length;

    return (
      <div className="rounded-xl border border-border bg-card p-2.5">
        {/* 시간 + 인원 배지 - 한 줄 */}
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-xs font-bold tabular-nums leading-tight">
            {startTime}–{endTime}
          </span>
          <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {count}명
          </span>
        </div>
        {/* 생성자 */}
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{creator}</p>
        {/* 참여자 pills - 최대 2개 후 +N */}
        {participants.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {participants.slice(0, 2).map((participant) => (
              <span
                key={participant.userId}
                className="rounded bg-muted px-1.5 py-0.5 text-[9px]"
              >
                {participant.nickname}
              </span>
            ))}
            {participants.length > 2 && (
              <span className="text-[9px] text-muted-foreground">
                +{participants.length - 2}
              </span>
            )}
          </div>
        )}
        {/* 참여 버튼 */}
        <button
          onClick={handleJoin}
          disabled={isPending}
          className={cn(
            "mt-2 w-full rounded-lg py-1 text-[10px] font-semibold transition",
            hasJoined
              ? "bg-primary/20 text-primary hover:bg-primary/30"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
          )}
        >
          {isPending ? "..." : hasJoined ? "취소" : "참여"}
        </button>
        {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">
              {optimisticTicket.startTime} - {optimisticTicket.endTime}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {optimisticTicket.creator} 님이 올린 농구 일정
            </p>
          </div>
          <div className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            {optimisticTicket.participants.length}명 참여
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-muted p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            참여자
          </div>
          <div className="flex flex-wrap gap-2">
            {optimisticTicket.participants.map((participant) => (
              <span
                key={participant.userId}
                className="rounded-full bg-card border border-border px-3 py-1 text-sm"
              >
                {participant.nickname}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-red-400">{error}</p> : <span />}
          <Button type="button" onClick={handleJoin} disabled={isPending}>
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : hasJoined ? (
              "참여 취소"
            ) : (
              "참여하기"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
