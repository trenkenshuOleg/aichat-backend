import * as dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
import { MongoClient, UpdateResult } from 'mongodb';
import { request, session } from './common/constants';
import { ISession } from './common/types';
import { getAnswer, getQuestion } from './helpers/helpers';
import dbClient from './api/db_api';

const api = process.env.API_URL || '';
let answer = '';

console.log(`Starting WebSocket connection to ${api}...`,);

// WS Client

const ai = new WebSocket(api);

ai.on('open', () => {
  console.log(`Connected to ${api}`);

  dbClient.get(session.userId)
    .then(async (res: ISession | null) => {
      if(res) session.sessionLog = res.sessionLog;
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
    const newEntry = '\n### Assistant:\n' + answer;
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

ai.on('error', (err: WebSocket.ErrorEvent) => { console.log(err.message) });
