import WebSocket from 'ws';
import { MongoClient } from 'mongodb';
import { request } from './common/constants';
import * as dotenv from 'dotenv';
import promptSync from 'prompt-sync';
import { IRequest, ISession } from './common/types';
import { getAnswer, getQuestion } from './helpers/helpers';

dotenv.config();

const api = process.env.API_URL || 'ws://localhost';
const myPort = Number(process.env.SERVER_PORT) || 8080;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbClient = new MongoClient(mongoUrl);
const prompt = promptSync();
let answer = '';

const session: ISession = {
  userId: '1a2b3c4d5e',
  sessionLog: [],
}

console.log(`Starting WebSocket connection to ${api}...`,);

// WS Client

const ai = new WebSocket(api);

ai.on('open', () => {
  console.log(`Connected to ${api}`);
  request.prompt = getQuestion(ai, session, prompt);
  getAnswer(ai, request);
})

ai.on('message', (event: string) => {
  const msg = JSON.parse(event);
  if (msg.event !== 'stream_end') {
    answer += msg.text;
    console.log(answer);
  } else {
    session.sessionLog.push('\n### Assistant:\n' + answer);
    answer = '';
    console.log('Once again: ')
    request.prompt = getQuestion(ai, session, prompt);
    getAnswer(ai, request);
  }
});

ai.on('ping', () => {
  ai.pong('ok', true);
});

ai.on('error', (err: WebSocket.ErrorEvent) => { console.log(err.message) });
