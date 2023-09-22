import WebSocket from 'ws';
import { request, session } from '../common/constants';
import { ILogMessage, ISession } from '../common/types';
import { getAnswer, getQuestion } from '../helpers/helpers';
import dbClient from '../api/db_api';

export const api = process.env.API_URL || '';
let answer = '';

export const ai = new WebSocket(api);

ai.on('open', () => {
  console.log(`Connected to ${api}`);

  dbClient.get(session.userId)
    .then(async (res: ISession | null) => {
      if (res) session.sessionLog = res.sessionLog;
      request.prompt = await getQuestion(ai, session);
      getAnswer(ai, request);
    })
})

ai.on('message', (event: string) => {
  const msg = JSON.parse(event);
  if (msg.event !== 'stream_end') {
    answer += msg.text;
    process.stdout.write(`${msg.text}`);
  } else {
    const newEntry: ILogMessage = {
      sender: 'Assistant',
      message: answer
    };
    session.sessionLog.push(newEntry);
    dbClient
      .set(session)
      .then(async () => {
        answer = '';
        console.log('Once again: ')
        request.prompt = await getQuestion(ai, session);
        getAnswer(ai, request);
      })
  }
});

ai.on('ping', () => {
  ai.pong('ok', true);
});

ai.on('error', (err: WebSocket.ErrorEvent) => {
  console.log(err.message);
  if (err.message === "ECONNREFUSED") {
  }
});