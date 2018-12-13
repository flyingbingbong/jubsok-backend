import * as http from 'http';
import { Response, NextFunction } from 'express';
import * as express from 'express';
import createWebsockerServer from '../ws';
import createRedisClient from '../redis';
import { addWsPerRequest, addRedisPerRequest } from '../../middlewares';
import { IApp, IWss, IRequest, IRedisClient } from '../../types';

const app: IApp = <IApp>express();
const server: http.Server = http.createServer(app);
const wss: IWss = createWebsockerServer(server);
const redis: IRedisClient = createRedisClient();

app.use(express.json());
app.use(addWsPerRequest(wss));
app.use(addRedisPerRequest(redis));
// app.use(routers)

/* below lines will be removed */
app.get('/', (req: IRequest, res: Response, next: NextFunction) => {
	res.json(Object.keys(req.wsClients));
	next();
});

export default server;