import { Collection, MongoClient, UpdateResult } from "mongodb";
import { ISession } from "../common/types";

export interface Idb {
  client: MongoClient;
  sessions: Collection<ISession>;
  get: (id: string) => Promise<ISession | null>;
  set: (session: ISession) => Promise<UpdateResult<ISession>>;
}