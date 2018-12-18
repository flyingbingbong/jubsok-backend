import { Router } from 'express';
import AuthRouter from './auth';
import MessageRouter from './message';
import UserRouter from './user';
import ChatRouter from './chat';
import FriendRouter from './friend';
import NoticeRouter from './notice';
import WeeklyTasteRouter from './weeklyTaste';
import WordRouter from './word';

const router = Router();

router.use('/auth', AuthRouter);
router.use('/message', MessageRouter);
router.use('/user', UserRouter);
router.use('/chat', ChatRouter);
router.use('/friend', FriendRouter);
router.use('/notice', NoticeRouter);
router.use('/weeklytaste', WeeklyTasteRouter);
router.use('/word', WordRouter);

export default router;

export {
	AuthRouter,
	MessageRouter,
	UserRouter,
	ChatRouter,
	FriendRouter,
	NoticeRouter,
	WeeklyTasteRouter,
	WordRouter,
}