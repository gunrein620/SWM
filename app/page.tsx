import { BoardClient } from "@/components/BoardClient";
import { getWeekDates } from "@/lib/calendar";
import { getTicketsByDate } from "@/lib/kv";

export default async function HomePage() {
  const weekDates = getWeekDates();
  const ticketEntries = await Promise.all(
    weekDates.map(async (dateItem) => [
      dateItem.value,
      await getTicketsByDate(dateItem.value)
    ] as const)
  );

  const initialTicketsByDate = Object.fromEntries(ticketEntries);

  return (
    <BoardClient
      weekDates={weekDates}
      initialTicketsByDate={initialTicketsByDate}
    />
  );
}
