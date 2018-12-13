import server from './app';
import runDB from './db';

const PORT: number = parseInt(<string>process.env['PORT'], 10) || 3000;

runDB();

server.listen(PORT, () => {
	console.log(`Server is running on ${PORT}`);
});
