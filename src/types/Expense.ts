export type Expense = {
  id: string;                 // uuid
  description: string;        // text
  amount: number;             // numeric(12,2) → number (JS)
  created_at: string;         // timestamp with time zone
};
