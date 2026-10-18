import dotenv from "dotenv";
dotenv.config();

const getENV = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const sessionMaxAge = Number(getENV("SESSION_MAX_AGE"));

if (!Number.isFinite(sessionMaxAge) || sessionMaxAge <= 0) {
  throw new Error("SESSION_MAX_AGE must be a positive number in milliseconds");
}

export const env = {
  nodeENV: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),

  
  db: {
    database: getENV("DATABASE_URL"),
  },


  secret: {
    SESSION_SECRET: getENV("SESSION_SECRET"),
    SESSION_MAX_AGE: sessionMaxAge
  }
};