type DataType<T extends object> = {
  [key in keyof T as key extends string ? `$${key}` : never]: T[key];
};

export type Data = {
  run_time: string;
  framework: string;
  language: string;
  directory: string;
};

export type InsertData = DataType<Data>;

export type ConuntItemsReturn = Record<string, number>;
