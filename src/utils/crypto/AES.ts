import * as crypto from 'crypto';
import { Cipher, Decipher } from 'crypto';

const AES_KEY: string = process.env['AES_SECRET'];
const IV: string = process.env['AES_IV'];
const algo: string = 'aes-256-ctr';

export const encrypt = (text: string): string => {
	const cipher: Cipher = crypto.createCipheriv(algo, AES_KEY, IV);
	var encrypted: string = cipher.update(text, 'utf8', 'hex');

	encrypted += cipher.final('hex');
	return encrypted;
}

export const decrypt = (encrypted: string): string => {
	var decipher: Decipher = crypto.createDecipheriv(algo, AES_KEY, IV);
	var decrypted: string = decipher.update(encrypted, 'hex', 'utf8');

	decrypted += decipher.final('utf8');
	return decrypted;
}