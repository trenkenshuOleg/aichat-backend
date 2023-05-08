import * as dotenv from 'dotenv';
dotenv.config();

import WebSocket from 'ws';
import { MongoClient, UpdateResult } from 'mongodb';
import { request, session } from './common/constants';
import promptSync from 'prompt-sync';
import { ISession } from './common/types';
import { getAnswer, getQuestion } from './helpers/helpers';
import dbClient from './api/db_api';

const api = process.env.API_URL || '';
const prompt = promptSync();
let answer = '';

console.log(`Starting WebSocket connection to ${api}...`,);

// WS Client

const ai = new WebSocket(api);

ai.on('open', () => {
  console.log(`Connected to ${api}`);

  dbClient.get(session.userId)
    .then((res: ISession | null) => {
      if(res) session.sessionLog = res.sessionLog;
      request.prompt = getQuestion(ai, session, prompt);
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
    dbClient.set(session)
      .then(() => {
        answer = '';
        console.log('Once again: ')
        request.prompt = getQuestion(ai, session, prompt);
        getAnswer(ai, request);
      })
  }
});

ai.on('ping', () => {
  ai.pong('ok', true);
});

ai.on('error', (err: WebSocket.ErrorEvent) => { console.log(err.message) });
