export type Participant = {
  userId: string;
  nickname: string;
};

export type Ticket = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  creator: string;
  participants: Participant[];
};

export type ActionState<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };
