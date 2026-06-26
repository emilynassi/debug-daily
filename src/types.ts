export interface Challenge {
  title: string;
  scenario: string;
  task: string;
  buggyCode: string;
  hint: string;
  fix: string;
  expectedOutput: string;
  concepts: string[];
}

export interface DayState {
  challenge: Challenge;
  hintShown: boolean;
  solved: boolean;
}

export interface StoredData {
  streak: number;
  lastKey: string | null;
  total: number;
  [dayKey: string]: DayState | number | string | null;
}
