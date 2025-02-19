export type RequestHeader = {
  id: number;
  name: string;
  value: string;
  disabled: boolean;
};

export type Profile = { id: string; requestHeaders: RequestHeader[] };

export type RemoveHeaderPayload = {
  headerId: number;
};
