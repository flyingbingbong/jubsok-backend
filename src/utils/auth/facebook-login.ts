import * as passport from 'passport';
import { Profile } from 'passport-facebook-token';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import { User } from '../../models';

const FACEBOOK_CLIENT_ID: string | undefined = process.env['FACEBOOK_CLIENT_ID'];
const FACEBOOK_CLIENT_SECRET: string | undefined = process.env['FACEBOOK_CLIENT_SECRET'];
const MALE: Array<string> = ['male'];
const FEMALE: Array<string> = ['female'];
const female: string = 'female';
const male: string = 'male';

export const passportConfig = (): void => {
	if (FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET) {
		passport.use(new FacebookTokenStrategy(
			{
				clientID: FACEBOOK_CLIENT_ID,
				clientSecret: FACEBOOK_CLIENT_SECRET
			},
			async (accessToken: string, refreshToken: string, profile: Profile) => {
				await User.facebookLogin(accessToken, refreshToken, profile);
			}
		));
	}
}

export const genderSelector = (gender: string): string | null => {
	if (MALE.indexOf(gender) !== -1)
		return male;
	else if (FEMALE.indexOf(gender) !== -1)
		return female;
	return null;
}