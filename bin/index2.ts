import { Database } from "bun:sqlite";

const db = new Database(`${import.meta.dir}/mydb.sqlite`, { create: true });

db.run(`delete from mytable where language like 'javascript'`);
