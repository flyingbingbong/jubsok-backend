import * as chai from 'chai';
import * as setupTest from '../../setupTest';
import { SinonSpy } from 'sinon';
import * as sinon from 'sinon';
import { addWsPerRequest } from '../';
import { IWss } from '../../types';

const expect = chai.expect;

describe('ws middleware', () => {
	var req: any;
	var res: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			req = setupTest.mockReq();
			res = setupTest.mockRes();
			next = sinon.spy(setupTest.mockNext());
		} catch (err) {
			throw err;
		}
	});

	describe('addWsPerRequest', async () => {
		it('should contain wsClients in req', async () => {
			try {
				const mockWss: any = {
					clientManager: { clients: { foo: 'bar' } }
				};

				await addWsPerRequest(<IWss>mockWss)(req, res, next);
				expect(req.wsClients).to.deep.equal(mockWss.clientManager.clients);
			} catch (err) {
				throw err;
			}
		})
	})

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})