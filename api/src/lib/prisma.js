require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { validateRuntimeEnv } = require("./env");

let prismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    validateRuntimeEnv();
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

module.exports = new Proxy(
  {},
  {
    get(_target, property) {
      const client = getPrismaClient();
      const value = client[property];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
