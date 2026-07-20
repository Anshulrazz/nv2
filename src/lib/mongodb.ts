import { MongoClient } from "mongodb";
import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_URL"');
}

const uri = process.env.DATABASE_URL;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so the client is not recreated.
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cachedMongoose: MongooseCache = globalWithMongoose.mongoose || { conn: null, promise: null };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cachedMongoose;
}

export async function connectToDatabase() {
  if (cachedMongoose.conn) {
    return cachedMongoose.conn;
  }

  if (!cachedMongoose.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 100,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cachedMongoose.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log("Successfully connected to MongoDB via Mongoose");
      return mongooseInstance;
    });
  }

  try {
    cachedMongoose.conn = await cachedMongoose.promise;
  } catch (e) {
    cachedMongoose.promise = null;
    throw e;
  }

  return cachedMongoose.conn;
}

export default clientPromise;
