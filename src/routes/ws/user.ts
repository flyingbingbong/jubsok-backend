import { MessageRouter } from '../../servers/ws/wsMessageRouter';
import { WsController } from '../../controllers';

const router = new MessageRouter();

const {
	getUser,
	broadcastConnection,
	heartbeat,
	welcome,
} = WsController.UserController;

router.use('broadcastConnection',
	getUser,
	broadcastConnection,
);

router.use('heartbeat',
	getUser,
	heartbeat,
);

router.use('welcome',
	getUser,
	welcome,
);

export default router;