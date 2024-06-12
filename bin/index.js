#! /usr/bin/env bun

import { copyFileSync, mkdirSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { exit, stdin, stdout } from "process";

import { $ } from "bun";
import { fileURLToPath } from "url";
import readline from "readline";

// Cores
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
};

// Função para gerar a pergunta e obter a resposta.
function readLine(prompt) {
  const readLineCommand = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  return new Promise((resolve) =>
    readLineCommand.question(prompt, (resp) => {
      readLineCommand.close();
      resolve(resp.trim());
    })
  );
}

let selectedIndex = 0;

// Exibição do menu passando as opções.
function displayMenu(options, prompt) {
  console.clear();
  console.log(prompt);
  options.forEach((option, index) => {
    const isSelected = index === selectedIndex;
    const arrow = isSelected ? "\x1b[35m->" : " ";
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

async function selectOption(options, prompt) {
  selectedIndex = 0;
  return new Promise((resolve) => {
    const menuInterface = readline.createInterface({
      input: stdin,
      output: stdout,
      terminal: true,
    });

    function handleKey(key) {
      if (key === "\u0003") {
        exit();
      } else if (key === "\u001b[A") {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      } else if (key === "\u001b[B") {
        selectedIndex = (selectedIndex + 1) % options.length;
      } else if (key === "\r") {
        stdin.setRawMode(false);
        stdin.pause();
        menuInterface.close();
        resolve(options[selectedIndex]);
      }
      // Renderizar menu ao mover entre as opções.
      displayMenu(options, prompt);
    }

    displayMenu(options, prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", handleKey);

    menuInterface.on("close", () => {
      stdin.removeListener("data", handleKey);
    });
  });
}

const folderName = await readLine("\x1b[35mNome do Projeto: ");

// Dados de framework e tipo.
const frameworks = ["angular", "react", "vue"];
geekhunt;

const selectedFramework = await selectOption(
  frameworks,
  "Selecione um Framework:"
);

const languages = ["javascript", "typescript"];
const selectedLanguage = await selectOption(
  languages,
  `Selecione a Linguagem para o ${selectedFramework}:`
);

// Valida se não foi passado nenhum comando errado.
if (!folderName || !selectedFramework || !selectedLanguage) {
  console.error("\x1b[31mEntrada Invalida!, Por Favor Verifique os Comandos!");
  exit(1);
}

// Nome do diretório atual.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Criando template
const templateDir = join(
  __dirname,
  "template",
  selectedFramework,
  selectedLanguage
);
const destDir = `./${folderName}`;

try {
  mkdirSync(destDir, { recursive: true });

  const copyTemplate = readdirSync(templateDir);

  copyTemplate.forEach((file) => {
    const srcPath = join(templateDir, file);
    const destPath = join(destDir, file);
    copyFileSync(srcPath, destPath);
  });

  console.log(
    `\x1b[32mProjeto ${folderName} Criado com Sucesso no Modelo ${selectedFramework.toUpperCase()} e ${selectedLanguage.toUpperCase()}`
  );

  const fileType = selectedLanguage === "javascript" ? "js" : "ts";
  await $`bun run ${folderName}/index.${fileType}`;
} catch (error) {
  console.error(`\x1b[31mErro: ${error.message}`);
  exit(1);
}
