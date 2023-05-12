import { WebSocketServer, WebSocket } from "ws";
import { IClientMessage, wsEvent } from "./types";
import { ISession } from "../common/types";
import dbClient from "../api/db_api";
import medium from "../medium/medium";
import { api } from "./ai_console_client";
import { aiClient } from "./ai_class";
import { generateId } from "../helpers/helpers";

class wsServer {
  server: WebSocketServer;
  connectionPool: WebSocket[];

  constructor(port: number) {
    this.connectionPool = [];
    this.server = new WebSocketServer({ port });
    this.server.on('connection', (ws) => {
      console.log('s con')
      const session: ISession = {
        userId: '',
        sessionLog: [],
      }
      const aiClient = new WebSocket(api);

      this.connectionPool.push(aiClient);

      ws.on('message', async (data: string) => {
        console.log('s mes', JSON.parse(data));
        const chunk: IClientMessage = JSON.parse(data);

        switch (chunk.event) {
          case wsEvent.restore:
            const id = chunk.payload === 'no ID'
              ? generateId()
              : chunk.payload;
            const answer: ISession | null = await dbClient.get(String(id));

            session.userId = String(id);
            if (answer)
              session.sessionLog = answer.sessionLog;
            // else
            //   dbClient.set(session);
            console.log('answ', answer);
            if (ws.readyState === WebSocket.OPEN) {
              const message: IClientMessage = {
                event: wsEvent.restore,
                payload: session,
              };
              console.log(message);
              ws.send(JSON.stringify(message));
            }
            break;

          case wsEvent.prompt:
            medium.emit('prompt', ws, aiClient, session, chunk.payload);
            break;

          case wsEvent.tech:
            /* TODO */
            break;

          default:
            console.log('Unknown WS event:', chunk.event, chunk.payload);
        }
      })

      ws.on('error', (err: Error) => console.log(err.message));

    })
  }
}


export default wsServer;
