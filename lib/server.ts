import chalk from "chalk";
import { ChildProcess, exec, spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { sendDiscordMsg } from "./utils";

const CWD = process.cwd();

export class Server {
  status: string = "offline";
  progress: number = 0;
  updateProcess: ChildProcess | null = null; // Child process for updating the server
  runProcess: ChildProcess | null = null; // Child process for running the server

  constructor() {
    this.init();
  }

  async init() {
    console.log(chalk.yellow("Initializing game server..."));
    sendDiscordMsg("Initialisation du serveur en cours");

    if (!existsSync("./palworld_server")) mkdirSync("./palworld_server");

    await this.updatePalworldServer().then(async () => {
      await this.runServer();
    });

    setTimeout(() => {
      setInterval(() => {
        this.checkServerEmpty();
      }, 60 * 1000);
    }, 5 * 60 * 1000);
  }

  getStatus() {
    return this.status;
  }

  updatePalworldServer() {
    return new Promise<void>((resolve, reject) => {
      this.status = "updating";
      sendDiscordMsg("Mise a jours en cours...");

      console.log(
        chalk.cyan("Starting Palworld server update using SteamCMD...")
      );

      // Spawn a child process to execute SteamCMD commands
      this.updateProcess = spawn(
        "steamcmd",
        [
          "+force_install_dir",
          join(CWD, "palworld_server"), // Set the installation directory
          "+login",
          "anonymous", // Login as an anonymous user
          "+app_update",
          "2394010", // Replace '1234567' with the actual app ID for Palworld
          "+quit", // Quit SteamCMD after completing the update
        ],
        {
          cwd: CWD,
        }
      );

      this.updateProcess.stdout.on("data", (data: any) => {
        console.log(chalk.green(`[SteamCMD] ${data}`));
      });

      this.updateProcess.stderr.on("data", (data: any) => {
        console.error(chalk.red(`[SteamCMD ERROR] ${data}`));
      });

      this.updateProcess.on("close", (code: any) => {
        if (code === 0 || code === 7) {
          console.log(
            chalk.green("Palworld server update completed successfully.")
          );
          sendDiscordMsg("Mise a jours terminee");
          resolve();
        } else {
          console.error(
            chalk.red(`SteamCMD process exited with code ${code}.`)
          );
          this.status = "offline";
          reject(new Error(`SteamCMD process failed with code ${code}`));
          sendDiscordMsg("Une erreur s'est produite lors de la mise a jour?");
        }
      });
    });
  }

  runServer() {
    this.status = "starting";
    console.log(chalk.cyan("Starting Palworld server..."));
    sendDiscordMsg("Demarrage du serveur Palworld...");

    this.runProcess = spawn("./palworld_server/PalServer.sh", [], {
      cwd: CWD,
    });

    this.status = "online";
    console.log(chalk.green("Server is now online."));
    sendDiscordMsg("Le serveur est desormais en ligne !");

    this.runProcess.stdout.on("data", (data) => {
      console.log(chalk.green(`[Server] ${data}`));
      sendDiscordMsg(`[Serveur] ${data}`);
    });

    this.runProcess.stderr.on("data", (data) => {
      console.error(chalk.red(`[Server ERROR] ${data}`));
      sendDiscordMsg(`[Serveur ERREUR] ${data}`);
    });

    this.runProcess.on("close", (code) => {
      this.status = "offline";
      if (code === 0) {
        console.log(chalk.yellow("Server stopped gracefully."));
        sendDiscordMsg("Le serveur s'est arrete normalement");
      } else {
        console.error(chalk.red(`Server process exited with code ${code}.`));
        sendDiscordMsg("Le serveur s'est arrete avec le code " + code);
      }
    });
  }

  stopServer() {
    if (this.runProcess) {
      console.log(chalk.cyan("Stopping Palworld server..."));
      sendDiscordMsg("Arret du serveur en cours...");

      // Terminate the process
      this.runProcess.stdout?.destroy();
      this.runProcess.stdin?.destroy();
      this.runProcess.stderr?.destroy();
      this.runProcess.kill("SIGINT");

      // Wait briefly to ensure the process is stopped
      setTimeout(() => {
        if (this.runProcess && !this.runProcess.killed) {
          console.error(chalk.red("Failed to stop the server process."));
        } else {
          console.log(chalk.yellow("Server has been stopped successfully."));
          this.runProcess = null; // Clear the run process reference
          this.status = "offline"; // Update the server status
        }
      }, 1000);
    } else {
      console.log(chalk.red("No running server process found to stop."));
      sendDiscordMsg("Le serveur ne veut pas se stopper ce batard");
    }
  }

  async checkServerEmpty() {
    const basicAuth = Buffer.from(`admin:Caca2Garf`).toString("base64");

    const res = await fetch("http://127.0.0.1:8212/v1/api/players", {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });

    if (!res.ok) {
      console.error("Server cannot reach pal api");
      return;
    }

    const data: any = await res.json();
    const players: any[] = data.players || [];

    if (players.length === 0) {
      sendDiscordMsg("Le est vide, tentative d'arret...");
      this.stopServer();
      setTimeout(() => {
        exec("sudo shutdown -h now", (err, stdout, stderr) => {
          if (err) {
            console.error(`Failed to shut down server: ${stderr}`);
            sendDiscordMsg(
              "Le serveur a essaye de s'eteindre mais une erreur s'est produite"
            );
          } else {
            console.log(`Server is shutting down: ${stdout}`);
            sendDiscordMsg(
              "Le serveur s'eteint physiquement. Il faudra passer par la passerelle pour le demarrer"
            );
          }
        });
      }, 10 * 1000);
    }
  }
}

export async function getServer() {
  if (!(global as any).SERVER) {
    (global as any).SERVER = new Server();
  }

  return (global as any).SERVER as Server;
}
