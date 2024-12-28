import chalk from "chalk";
import { ChildProcess, exec, spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { sendDiscordMsg } from "./utils";

const CWD = process.cwd();

export class Server {
  status: string = "offline";
  players: number = 0;
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
    }, 3 * 60 * 1000);
  }

  getStatus() {
    return this.status;
  }

  updatePalworldServer() {
    return new Promise<void>((resolve, reject) => {
      /* It's canceling if server already updated */

      /* It's logging and changing the status */
      this.status = "updating";
      sendDiscordMsg("Mise a jours en cours...");
      console.log(
        chalk.cyan("Starting Palworld server update using SteamCMD...")
      );

      /* It's creating steamcmd process */
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

      /* It's listening to steamcmd logs */
      this.updateProcess.stdout?.on("data", (data) => {
        console.log(chalk.green(`[SteamCMD] ${data}`));
      });

      /* It's listening to steamcmd errors */
      this.updateProcess.stderr?.on("data", (data) => {
        console.error(chalk.red(`[SteamCMD ERROR] ${data}`));
      });

      /* It's waiting steamCMD to close */
      this.updateProcess.on("close", (code) => {
        if (code === 0 || code === 7) {
          /* It's handling steamcmd success and logging */
          console.log(
            chalk.green("Palworld server update completed successfully.")
          );
          sendDiscordMsg("Mise a jours terminee");
          resolve();
        } else {
          /* It's handling steamCMD errors and logging */
          console.error(
            chalk.red(`SteamCMD process exited with code ${code}.`)
          );
          this.status = "offline";
          sendDiscordMsg("Une erreur s'est produite lors de la mise a jour?");
          reject(new Error(`SteamCMD process failed with code ${code}`));
        }
      });
    });
  }

  runServer() {
    /* It's canceling if server is already running */
    if (this.status === "online") return;

    this.status = "starting";
    console.log(chalk.cyan("Starting Palworld server..."));
    sendDiscordMsg("Demarrage du serveur Palworld...");

    this.runProcess = spawn("./palworld_server/PalServer.sh", [], {
      cwd: CWD,
    });

    this.runProcess.stdout?.on("data", (data) => {
      console.log(chalk.green(`[Server] ${data}`));
      if (data.includes("Running Palworld")) {
        this.status = "online";
        console.log(chalk.green("Server is now online."));
        sendDiscordMsg("Le serveur est desormais en ligne !");
      }
    });

    this.runProcess.stderr?.on("data", (data) => {
      console.error(chalk.red(`[Server ERROR] ${data}`));
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

  async stopServer() {
    if (this.status === "offline") return;

    if (this.runProcess) {
      console.log(chalk.cyan("Stopping Palworld server..."));
      sendDiscordMsg("Arret du serveur en cours...");

      const basicAuth = Buffer.from(`admin:Caca2Garf`).toString("base64");

      const res = await fetch("http://127.0.0.1:8212/v1/api/shutdown", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          waittime: 5,
          message: "Le serveur va s'arreter dans 5 secondes",
        }),
      });

      if (!res.ok) {
        console.error("Server cannot reach pal api");
        sendDiscordMsg("Impossible d'eteindre le serveur via L'API");
        return;
      } else {
        sendDiscordMsg(
          "Signal d'arret OK, le serveur s'eteindra dans quelques instants"
        );
        setTimeout(() => {
          this.runProcess?.kill();
        }, 15000);
      }
    } else {
      console.log(chalk.red("No running server process found to stop."));
      sendDiscordMsg(
        "Le serveur n'est juste pas en ligne donc il ne va pas se stopper?"
      );
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

    // eslint-disable-next-line
    const data: any = await res.json();
    // eslint-disable-next-line
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
  // eslint-disable-next-line
  if (!(global as any).SERVER) {
    // eslint-disable-next-line
    (global as any).SERVER = new Server();
  }

  // eslint-disable-next-line
  return (global as any).SERVER as Server;
}
