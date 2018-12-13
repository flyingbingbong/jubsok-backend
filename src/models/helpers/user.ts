export const searchFilter = (
	gender: string | null,
	weeklyTastes: Array<number> | null,
	text: string | null,
): any => {
	var match: any = {};

	if (gender)
		match.gender = gender;
	if (text) {
		match.$or = [
			{ 'favorites.content': { $regex: `.*${text}.*` }},
			{ 'interests': { $regex: `.*${text}.*` }},
		];
	}
	if (weeklyTastes) {
		weeklyTastes.forEach((v: number, i: number) => {
			if ([0, 1].indexOf(v) !== -1)
				match[`weeklyTastes.${i}`] = v;
		});
	}
	return match;
}