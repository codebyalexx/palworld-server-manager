import chalk from "chalk";

export class Server {
  constructor() {
    console.log(chalk.yellow("Initializing game server..."));
  }
}

export async function getServer() {
  if (!(global as any).SERVER) {
    (global as any).SERVER = new Server();
  }

  return (global as any).SERVER as Server;
}
