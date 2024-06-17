#! /usr/bin/env bun

import type { ConuntItemsReturn, Data } from "./types";
import { cwd, exit, stdin } from "process";

import { $ } from "bun";
import { colors } from "./colors";
import { logDB } from "./db";
import { parseArgs } from "util";

const { insertData, db } = logDB();
const dataRun = new Date().toString();
const frameworks = ["angular", "react", "vue"];
const languages = ["javascript", "typescript"];

// frameworks mais usados -> 1: React (29) \n 2: Angular (2) \n 3: Vue (0)
// linguages mais usadas -> 1: TS (10) \n 2: JS (0)
// HORA do dia onde mais clona -> 15h

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    report: {
      type: "boolean",
    },
  },
  allowPositionals: true,
});

if (values.report) {
  const query = db.query<Data, []>("select * from mytable");
  const allData = query.all();

  // InitialValues report
  const initialValueFramework = {} as ConuntItemsReturn;
  const initialValueLanguage = {} as ConuntItemsReturn;
  const initialValueHours = {} as ConuntItemsReturn;

  const countItems = (
    items: Data[],
    key: keyof Data,
    initialValue: ConuntItemsReturn,
    list?: string[]
  ) => {
    return items.reduce((acc, item) => {
      const value = item[key];

      if (list && list.includes(value)) {
        acc[value] = (acc[value] || 0) + 1;
      } else {
        const data = new Date(value).getHours();
        acc[data] = (acc[data] || 0) + 1;
      }
      return acc;
    }, initialValue);
  };

  const frameworkCounts = countItems(
    allData,
    "framework",
    initialValueFramework,
    frameworks
  );

  const languageCounts = countItems(
    allData,
    "language",
    initialValueHours,
    languages
  );

  const hoursCounts = countItems(allData, "run_time", initialValueLanguage);
  const mostExecutedHour = Object.keys(hoursCounts).reduce((a, b) =>
    hoursCounts[a] > hoursCounts[b] ? a : b
  );

  console.log("Frameworks repetidos:");
  console.table(frameworkCounts);
  console.log("------------------------------------------");
  console.log("Linguagens repetidas:");
  console.table(languageCounts);

  console.log("------------------------------------------");
  console.log(`Horario de maior clonagem: ${mostExecutedHour}h`);

  exit(1);
}

// #region Func
async function readInputData(prompt: string): Promise<string> {
  console.write(prompt);
  for await (const line of console) {
    return line.trim();
  }
  return "";
}

let selectedIndex = 0;

function displayMenu(options: string[], prompt: string) {
  console.clear();
  console.log(prompt);

  options.forEach((option, index) => {
    const isSelected = index === selectedIndex;
    const arrow = isSelected ? `${colors.purple}->` : "  ";
    let color;
    switch (option) {
      case "angular":
        color = colors.red;
        break;
      case "react":
        color = colors.blue;
        break;
      case "vue":
        color = colors.green;
        break;
      case "javascript":
        color = colors.yellow;
        break;
      case "typescript":
        color = colors.blue;
        break;
      default:
        color = colors.reset;
    }
    const content = color + option.toUpperCase() + colors.reset;
    console.log(`${arrow} ${content}`);
  });
}

async function selectOption(
  options: string[],
  prompt: string
): Promise<string> {
  selectedIndex = 0;

  return new Promise((resolve) => {
    const handleKey = (key: string) => {
      switch (key) {
        case "\u0003":
          exit();
        case "\u001b[A":
          selectedIndex = (selectedIndex - 1 + options.length) % options.length;
          break;
        case "\u001b[B":
          selectedIndex = (selectedIndex + 1) % options.length;
          break;
        case "\r":
          stdin.setRawMode(false);
          // Para a leitura de dados, assim n tendo mais atualizacoes
          stdin.pause();
          // Remove o evento da lista de eventos para não ser mais executado(não existir)
          stdin.removeListener("data", handleKey);
          resolve(options[selectedIndex]);
          break;
        default:
          break;
      }
      displayMenu(options, prompt);
    };

    displayMenu(options, prompt);
    // Ativa modo bruto de leitura(caract. p caract.)
    stdin.setRawMode(true);
    // Retoma a leitura, isso quando tem um pause
    stdin.resume();
    // define o tipo de codificacao dos dados lidos
    stdin.setEncoding("utf8");
    // Cria o evento pelo tipo passado e o que ele tem que executar
    stdin.on("data", handleKey);
  });
}

// #endregion

const folderName = await readInputData(`${colors.purple}Nome do Projeto: `);

const selectedFramework = await selectOption(
  frameworks,
  "Selecione um Framework:"
);

const selectedLanguage = await selectOption(
  languages,
  `Selecione a Linguagem para o ${selectedFramework}:`
);

if (!folderName || !selectedFramework || !selectedLanguage) {
  console.error(
    `${colors.red}Entrada Invalida!, Por Favor Verifique os Comandos!`
  );
  exit(1);
}

const templateDir = `${
  import.meta.dir
}/template/${selectedFramework}/${selectedLanguage}`;
const destDir = `${cwd()}/${folderName}`;

try {
  await $`mkdir -p ${destDir}`;
  await $`cp -r ${templateDir}/* ${destDir}/`;

  console.log(
    `${
      colors.green
    }Projeto ${folderName} Criado com Sucesso no Modelo ${selectedFramework.toUpperCase()} e ${selectedLanguage.toUpperCase()}`
  );

  const data = {
    $run_time: dataRun,
    $framework: selectedFramework,
    $language: selectedLanguage,
    $directory: destDir,
  };
  insertData(data);

  const fileType = selectedLanguage === "javascript" ? "js" : "ts";
  await $`bun run ${folderName}/index.${fileType}`;
} catch (error: any) {
  console.error(`${colors.red}Erro: ${error.message}`);
  exit(1);
}
