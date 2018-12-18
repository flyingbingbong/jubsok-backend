import * as http from 'http';
import * as express from 'express';
import createWebsockerServer from '../ws';
import createRedisClient from '../redis';
import { addWsPerRequest, addRedisPerRequest } from '../../middlewares';
import { IApp, IWss, IRequest, IRedisClient } from '../../types';
import router from '../../routes/app';

const app: IApp = <IApp>express();
const server: http.Server = http.createServer(app);
const wss: IWss = createWebsockerServer(server);
const redis: IRedisClient = createRedisClient();

app.use(express.json());
app.use(addWsPerRequest(wss));
app.use(addRedisPerRequest(redis));
app.use(router);

export default server;