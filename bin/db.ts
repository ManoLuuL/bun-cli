import { Database } from "bun:sqlite";
import type { InsertData } from "./types";

export const logDB = () => {
  const db = new Database(`${import.meta.dir}/mydb.sqlite`, { create: true });

  db.run(`
    CREATE TABLE IF NOT EXISTS mytable (
      run_time TEXT,
      framework TEXT,
      language TEXT,
      directory TEXT
    )
    `);

  const preInsertData = db.prepare(
    "INSERT INTO mytable (run_time, framework, language, directory) VALUES ($run_time, $framework, $language, $directory)"
  );

  const insertData = (item: InsertData) => preInsertData.run(item);

  return {
    db,
    insertData,
  };
};
