import { WebSocketServer, WebSocket } from "ws";
import { IClientMessage, wsEvents, messageEvent, IAiMessage, techEvents, streamEvents } from "./types";
import { ILogMessage, ISession } from "../common/types";
import dbClient from "../api/db_api";
import medium from "../medium/medium";
import { api } from "./ai_console_client";
import { aiClient } from "./ai_class";
import { generateId, isId } from "../helpers/helpers";
import fs from 'node:fs';
//import http from 'node:http';

// WS Server Decorator
class wsServer {
  private server: WebSocketServer;
  private connectionPool: WebSocket[];
  constructor(port: number) {
    this.connectionPool = [];

    this.server = new WebSocketServer({
      port,
    });

    // How SERVER acts when a client is connected
    this.server.on(wsEvents.connect, (wsClient) => {
      console.log('s con')
      let pingCounter = 0;
      const session: ISession = {
        userId: '',
        sessionLog: [],
      }

      // For each new client we create new connection to AI server
      const aiClient = new WebSocket(api);
      const aiConnected = new Promise<boolean>(resolve => {
        aiClient.once('open', () => resolve(true))
      })

      // Listen to answers from AI to send it to a client and save to a session log
      aiClient.on(wsEvents.message, (data: string) => {
        const lastMessageInLog: ILogMessage | undefined = session.sessionLog[session.sessionLog.length - 1];
        const aiMessage: IAiMessage = JSON.parse(data);
        if (!lastMessageInLog || lastMessageInLog.sender !== 'Assistant') {
          session.sessionLog.push({
            sender: 'Assistant',
            message: aiMessage.text
          });
        } else if (aiMessage.event === streamEvents.stream) {
          lastMessageInLog.message += aiMessage.text;
        } else if (aiMessage.event === streamEvents.end) {
          dbClient.set(session);
        }
        medium.emit(messageEvent.promptAnswer, wsClient, data);
      })
      // For further limitation of graphic cards load. **TODO**
      this.connectionPool.push(aiClient);

      wsClient.on(wsEvents.message, async (data: string) => {
        //console.log('s mes', JSON.parse(data));
        const chunk: IClientMessage = JSON.parse(data);
        switch (chunk.event) {
          // If client tries to load saved session
          case messageEvent.restore:
            const id = chunk.payload === 'no ID'
              ? await generateId()
              : chunk.payload;
            const answer: Promise<ISession | null> = dbClient.get(String(id));
            const notEmpty = await answer;
            if (notEmpty)
              session.sessionLog = notEmpty.sessionLog;
            session.userId = String(id);
            if (wsClient.readyState === WebSocket.OPEN) {
              const loadedSession: IClientMessage = {
                event: messageEvent.restore,
                payload: session,
              };
              const readyState: IClientMessage = {
                event: messageEvent.ready,
                payload: '',
              }
              console.log('loaded session for', session.userId);
              wsClient.send(JSON.stringify(loadedSession));
              if (await aiConnected) {
                console.log('server connection ready for', session.userId);
                wsClient.send(JSON.stringify(readyState));
              }
            }
            break;

          // If client sends prompt we add it to a session log and pass to AI to process
          case messageEvent.prompt:
            console.log('server prompt', chunk.payload);
            session.sessionLog.push({
              sender: 'Human',
              message: chunk.payload as string,
            })
            medium.emit(messageEvent.prompt, aiClient, wsClient, session, false);
            break;

          case messageEvent.tech:
            switch (chunk.type) {
              case techEvents.erase:
                console.log('is id', chunk.payload, isId(chunk.payload as string));
                if (typeof chunk.payload === 'string') {
                  console.log('erasing ' + chunk.payload);
                  const result = await dbClient.purge(chunk.payload);
                  if (result.matchedCount === 1) {
                    session.sessionLog = [];
                    const clearSession: IClientMessage = {
                      event: messageEvent.restore,
                      payload: session,
                    };
                    wsClient.send(JSON.stringify(clearSession));
                    console.log('erased ' + chunk.payload)
                  } else {
                    console.log('Try to remove session ' + session.userId + ' but its not there')
                  }
                }
                break;

              case techEvents.regenerate:
                session.sessionLog.pop();
                medium.emit(messageEvent.prompt, aiClient, wsClient, session, false);
                break;

              case techEvents.goOn:
                medium.emit(messageEvent.prompt, aiClient, wsClient, session, true);
                break;

              case techEvents.ping:
                console.log('got ping', ++pingCounter, chunk.payload);

            }
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
