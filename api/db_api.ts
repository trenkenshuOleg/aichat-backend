import { ISession } from "../common/types";
import { Idb } from "./types";
import { Collection, MongoClient } from "mongodb";

class db implements Idb {
  client: MongoClient;
  sessions: Collection<ISession>;

  constructor(url: string) {
    this.client = new MongoClient(url);
    this.sessions =
    this.client
        .db("ai_chat")
        .collection<ISession>('ai_sessions');
  }

  async get(id: string) {
    let session: ISession | null = {
      userId: '',
      sessionLog: []
    }

    try {
      const query = { userId: id };
      session = await this.sessions.findOne(query);
    } catch (err: any) {
      console.log(err.message)
    }

    return session;
  }

  async set(session: ISession) {
    return await this.sessions.updateOne({ userId: session.userId}, { $set:session }, { upsert: true });
  }

  async purge(session: ISession) {
    return await this.set({userId: session.userId, sessionLog: []})
  }
}

const mongoUrl =
  'mongodb://'
  + (process.env.MNG_USER || '')
  + ':'
  + (process.env.MNG_PASSWORD || '')
  + '@'
  + (process.env.MNG_URL || '');
  + '/ai_chat'

const dbClient = new db(mongoUrl);

export default dbClient;