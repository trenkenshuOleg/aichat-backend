import { InsertOneResult, MongoClient } from "mongodb";
import { ISession } from "../common/types";
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUrl =
  'mongodb://'
  + (process.env.MNG_USER || '')
  + ':'
  + (process.env.MNG_PASSWORD || '')
  + '@'
  + (process.env.MNG_URL || '');

const dbClient = new MongoClient(mongoUrl);

const sessions =
  dbClient
    .db("ai_chat")
    .collection<ISession>('ai_sessions');

const dbGet = async (id: string): Promise<ISession | null> => {
  let session: ISession | null = {
    userId: '',
    sessionLog: []
  }

  try {
    const query = { userId: id };
    session = await sessions.findOne(query);
  } catch (err) {
    console.log(err.message)
  }

  return session;
}

const dbSet = async (session: ISession): Promise<InsertOneResult<ISession>> => {
  return await sessions.insertOne(session);
}

export { dbClient, dbGet, dbSet };