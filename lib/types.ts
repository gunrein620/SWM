export type Ticket = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  creator: string;
  participants: string[];
};

export type ActionState<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };
