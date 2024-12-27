import chalk from "chalk";
import { ChildProcess, spawn } from "child_process";

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
    await this.updatePalworldServer().then(async () => {
      await this.runServer();
    });
  }

  getStatus() {
    return this.status;
  }

  updatePalworldServer() {
    return new Promise<void>((resolve, reject) => {
      this.status = "updating";

      console.log(
        chalk.cyan("Starting Palworld server update using SteamCMD...")
      );

      // Spawn a child process to execute SteamCMD commands
      this.updateProcess = spawn(
        "steamcmd",
        [
          "+login",
          "anonymous", // Login as an anonymous user
          "+force_install_dir",
          "./palworld_server", // Set the installation directory
          "+app_update",
          "2394010", // Replace '1234567' with the actual app ID for Palworld
          "+quit", // Quit SteamCMD after completing the update
        ],
        {
          cwd: "./steam/",
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
          resolve();
        } else {
          console.error(
            chalk.red(`SteamCMD process exited with code ${code}.`)
          );
          this.status = "offline";
          reject(new Error(`SteamCMD process failed with code ${code}`));
        }
      });
    });
  }

  runServer() {
    this.status = "starting";
    console.log(chalk.cyan("Starting Palworld server..."));

    this.runProcess = spawn("./PalServer.exe", [], {
      cwd: "./steam/palworld_server",
    });

    this.status = "online";
    console.log(chalk.green("Server is now online."));

    this.runProcess.stdout.on("data", (data) => {
      console.log(chalk.green(`[Server] ${data}`));
    });

    this.runProcess.stderr.on("data", (data) => {
      console.error(chalk.red(`[Server ERROR] ${data}`));
    });

    this.runProcess.on("close", (code) => {
      this.status = "offline";
      if (code === 0) {
        console.log(chalk.yellow("Server stopped gracefully."));
      } else {
        console.error(chalk.red(`Server process exited with code ${code}.`));
      }
    });
  }

  stopServer() {
    if (this.runProcess) {
      console.log(chalk.cyan("Stopping Palworld server..."));

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
    }
  }
}

export async function getServer() {
  if (!(global as any).SERVER) {
    (global as any).SERVER = new Server();
  }

  return (global as any).SERVER as Server;
}
