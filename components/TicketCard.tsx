"use client";

import { LoaderCircle, Users } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toggleParticipationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Ticket } from "@/lib/types";

type TicketCardProps = {
  ticket: Ticket;
  nickname: string;
};

export function TicketCard({ ticket, nickname }: TicketCardProps) {
  const [serverTicket, setServerTicket] = useState(ticket);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticTicket, updateOptimisticTicket] = useOptimistic(
    serverTicket,
    (currentTicket: Ticket, nextNickname: string) => {
      const joined = currentTicket.participants.includes(nextNickname);

      return {
        ...currentTicket,
        participants: joined
          ? currentTicket.participants.filter(
              (participant) => participant !== nextNickname
            )
          : [...currentTicket.participants, nextNickname]
      };
    }
  );

  const hasJoined = optimisticTicket.participants.includes(nickname);

  function handleJoin() {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setError("먼저 닉네임을 입력해주세요.");
      return;
    }

    setError(null);
    updateOptimisticTicket(trimmedNickname);

    startTransition(async () => {
      const result = await toggleParticipationAction({
        date: serverTicket.date,
        ticketId: serverTicket.id,
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

  return (
    <Card className="overflow-hidden bg-white/95">
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
          <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {optimisticTicket.participants.length}명 참여
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-secondary/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            참여자
          </div>
          <div className="flex flex-wrap gap-2">
            {optimisticTicket.participants.map((participant) => (
              <span
                key={`${optimisticTicket.id}-${participant}`}
                className="rounded-full bg-white px-3 py-1 text-sm shadow-sm"
              >
                {participant}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
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
