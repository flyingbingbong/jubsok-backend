import { IWsClient, IMessageRouteWs, IWsData, IWsRequest } from '../../types';

export class MessageRouter {
	public stackMap: any;

	constructor() {
		this.stackMap = {};
	}

	public async handle(req: IWsRequest, data: IWsData, msgPrefix: string) {
		try {
			var next: Function;
			var stack: Array<Function>
			var err: Error;
			var pass: boolean;

			if (!data.type)
				return;
			stack = this.stackMap[data.type];
			if (!(stack && Array.isArray(stack)))
				return;
			next = (innerError: Error) => {
				if (innerError)
					err = innerError;
				else
					pass = true;
			}
			for (let f of stack) {
				pass = false;
				await f(req, data.data || {}, next);
				if (err)
					return this.errorHandler(req.ws, `${msgPrefix}/${err.message}`);
				if (!pass)
					break;
			}
		} catch (err) {
			throw err;
		}
	}

	public use(type: string, ...layers: Array<any>) {
		if (!this.stackMap[type])
			this.stackMap[type] = [];
		this.push(this.stackMap[type], layers);
	}

	private push(stack: Array<Function>, layer: Array<any> | Function) {
		if (!Array.isArray(layer)) {
			stack.push(layer);
			return;
		}
		for (let l of layer) {
			this.push(stack, l);
		}
	}

	private errorHandler(ws: IWsClient, message: string): void {
		// mail(err)
		throw Error(message);
	}
}

export const addOnMessage = (wss: IMessageRouteWs) => {
	wss.onMessage = function(prefix: string, router: MessageRouter): void {
		for (let type of Object.keys(router.stackMap)) {
			wss.messageRouter.use(`${prefix}/${type}`, router.stackMap[type]);
		}
		return this;
	}
}

export default (wss: IMessageRouteWs) => {
	wss.messageRouter = new MessageRouter();
	addOnMessage(wss);
}