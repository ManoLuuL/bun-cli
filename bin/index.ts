#! /usr/bin/env bun

import type { ConuntItemsReturn, Data } from "./types";
import { cwd, exit, stdin } from "process";

import { $ } from "bun";
import { colors } from "./colors";
import { logDB } from "./db";
import { parseArgs } from "util";

let selectedIndex = 0;

// Função para ler dados de entrada
async function readInputData(prompt: string): Promise<string> {
  console.write(prompt);
  for await (const line of console) {
    return line.trim();
  }
  return "";
}

// Função para exibir o menu de opções
function displayMenu(options: string[], prompt: string) {
  console.clear();
  console.log(prompt);
  options.forEach((option, index) => {
    const isSelected = index === selectedIndex;
    const arrow = isSelected ? `${colors.purple}->` : "  ";
    const color = getColor(option);
    const content = color + option.toUpperCase() + colors.reset;
    console.log(`${arrow} ${content}`);
  });
}

// Função para obter a cor com base na opção
function getColor(option: string): string {
  switch (option) {
    case "angular":
      return colors.red;
    case "react":
      return colors.blue;
    case "vue":
      return colors.green;
    case "javascript":
      return colors.yellow;
    case "typescript":
      return colors.blue;
    default:
      return colors.reset;
  }
}

// Função para selecionar uma opção do menu
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

// Função para contar itens com base em uma chave específica
function countItems(
  items: Data[],
  key: keyof Data,
  initialValue: ConuntItemsReturn,
  list?: string[]
) {
  const result = items.reduce((acc, item) => {
    const value = item[key];

    if (list && list.includes(value)) {
      acc[value] = (acc[value] || 0) + 1;
      list.forEach((item) => {
        if (!(item in acc)) {
          acc[item] = 0;
        }
      });
    } else if (key === "run_time") {
      const data = new Date(value).getHours();
      acc[data] = (acc[data] || 0) + 1;
    }

    return acc;
  }, initialValue);

  return result;
}

// Função para ordenar os resultados de forma decrescente
function sortDescending(obj: ConuntItemsReturn) {
  const initialValueSortedReduce = {} as ConuntItemsReturn;
  return Object.keys(obj)
    .sort((a, b) => obj[b] - obj[a])
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, initialValueSortedReduce);
}

// Função para exibir relatório baseado na escolha do usuário
function generateReport(reportSelected: string, allData: Data[]): void {
  const initialValueFramework = {} as ConuntItemsReturn;
  const initialValueLanguage = {} as ConuntItemsReturn;
  const initialValueHours = {} as ConuntItemsReturn;

  switch (reportSelected) {
    case "framework":
      console.log("Frameworks Repetidos:");

      console.table(
        sortDescending(
          countItems(allData, "framework", initialValueFramework, frameworks)
        )
      );

      break;
    case "linguagem":
      console.log("Linguagens Repetidas:");
      console.table(
        sortDescending(
          countItems(allData, "language", initialValueLanguage, languages)
        )
      );
      break;
    case "hora":
      console.log(
        `Horario de Maior Clonagem: ${getBusiestHour(
          allData,
          initialValueHours
        )}h`
      );
      break;
    case "todos":
      console.log("Frameworks Repetidos:");
      console.table(
        sortDescending(
          countItems(allData, "framework", initialValueFramework, frameworks)
        )
      );
      console.log("------------------------------------------");
      console.log("Linguagens Repetidas:");
      console.table(
        sortDescending(
          countItems(allData, "language", initialValueLanguage, languages)
        )
      );
      console.log("------------------------------------------");
      console.log(
        `Horario de Maior Clonagem: ${getBusiestHour(
          allData,
          initialValueHours
        )}h`
      );
      break;
    default:
      console.error("Opção de relatório inválida!");
      exit(1);
  }
}

// Função para obter a hora mais executada
function getBusiestHour(
  allData: Data[],
  initialValue: ConuntItemsReturn
): string {
  const hoursCounts = countItems(allData, "run_time", initialValue);
  return Object.keys(hoursCounts).reduce((a, b) =>
    hoursCounts[a] > hoursCounts[b] ? a : b
  );
}

// Configuração e execução principal
const { insertData, db } = logDB();
const dataRun = new Date().toString();
const frameworks = ["angular", "react", "vue"];
const languages = ["javascript", "typescript"];
const reportOptions = ["framework", "linguagem", "hora", "todos"];

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
  const allData = db.query<Data, []>("select * from mytable").all();
  const reportSelected = await selectOption(
    reportOptions,
    "Selecione um Tipo de Relatorio:"
  );
  generateReport(reportSelected, allData);
  exit();
}

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
