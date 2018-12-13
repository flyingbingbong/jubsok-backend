import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonSpy } from 'sinon';
import * as helpers from '../helpers';
import * as setupTest from '../../../setupTest';
import { User } from '../../../models';

const expect = chai.expect;

describe('ws helper controller', () => {
	var req: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			req = setupTest.mockWsReq();
			req.auth = {};
			next = sinon.spy(setupTest.mockNext());
		} catch (err) {
			throw err;
		}
	});

	describe('checkId', () => {
		const checkId: Function = helpers.checkId;

		it('should pass', async () => {
			try {
				const prop: string = 'prop';

				req[prop] = (new User())._id.toString();
				await checkId('msgPrefix', prop)(req, {}, next);
				sinon.assert.notCalled(req.ws.send);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		})

		it('should fail', async () => {
			try {
				const prop: string = 'prop';

				req[prop] = (new User())._id.toString() + 'a';
				await checkId('msgPrefix', prop)(req, {}, next);
				sinon.assert.calledOnce(req.ws.send);
				sinon.assert.notCalled(next);
			} catch (err) {
				throw err;
			}
		})
	})
});