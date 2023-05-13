import { WebSocketServer, WebSocket } from "ws";
import { IClientMessage, wsEvents, messageEvent, IAiMessage } from "./types";
import { ISession } from "../common/types";
import dbClient from "../api/db_api";
import medium from "../medium/medium";
import { api } from "./ai_console_client";
import { aiClient } from "./ai_class";
import { generateId } from "../helpers/helpers";

// WS Server Decorator
class wsServer {
  server: WebSocketServer;
  connectionPool: WebSocket[];

  constructor(port: number) {
    this.connectionPool = [];
    this.server = new WebSocketServer({ port });

    // How SERVER acts when a client is connected
    this.server.on(wsEvents.connect, (wsClient) => {
      console.log('s con')
      const session: ISession = {
        userId: '',
        sessionLog: [],
      }

      // For each new client we create new connection to AI server
      const aiClient = new WebSocket(api);

      // Listen to answers from AI to send it to a client and save to a session log
      aiClient.on(wsEvents.message, (data: string) => {
        const lastMessageInLog = session.sessionLog[session.sessionLog.length - 1];
        const aiMessage: IAiMessage = JSON.parse(data);
        if (lastMessageInLog.sender !== 'Assistant') {
          session.sessionLog.push({
            sender: 'Assistant',
            message: aiMessage.text
          });
        } else if (aiMessage.event !== 'stream_end') {
          lastMessageInLog.message += aiMessage.text;
        } else if (aiMessage.event === 'stream_end') {
          dbClient.set(session);
        }
        medium.emit(messageEvent.promptAnswer, wsClient, data);
      })
      // For further limitation of graphic cards load. **TODO**
      this.connectionPool.push(aiClient);

      wsClient.on(wsEvents.message, async (data: string) => {
        console.log('s mes', JSON.parse(data));
        const chunk: IClientMessage = JSON.parse(data);

        switch (chunk.event) {
          // If client tries to load saved session
          case messageEvent.restore:
            const id = chunk.payload === 'no ID'
              ? await generateId()
              : chunk.payload;
            const answer: ISession | null = await dbClient.get(String(id));
            session.userId = String(id);
            if (answer)
              session.sessionLog = answer.sessionLog;
            console.log('answ restore', answer);
            if (wsClient.readyState === WebSocket.OPEN) {
              const loadedSession: IClientMessage = {
                event: messageEvent.restore,
                payload: session,
              };
              console.log(loadedSession);
              wsClient.send(JSON.stringify(loadedSession));
            }
            break;

          // If client sends prompt we add it to a session log and pass to AI to process
          case messageEvent.prompt:
            console.log('server prompt', chunk.payload);
            session.sessionLog.push({
              sender: 'Human',
              message: chunk.payload as string,
            });
            medium.emit(messageEvent.prompt, aiClient, session);
            break;

          case messageEvent.tech:
            /* TODO */
            break;

          default:
            console.log('Unknown WS event:', chunk.event, chunk.payload);
        }
      })

      wsClient.on(wsEvents.error, (err: Error) => console.log(err.message));

    })
  }
}


export default wsServer;
