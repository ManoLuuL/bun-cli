type Z<T extends object> = {
  [key in keyof T as key extends string ? `$${key}` : never]: T[key];
};

export type Data = {
  run_time: string;
  framework: string;
  language: string;
  directory: string;
};

export type InsertData = Z<Data>;

export type ConuntItemsReturn = Record<string, number>;
