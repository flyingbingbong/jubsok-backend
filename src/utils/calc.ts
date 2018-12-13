export function sumOf(arr: Array<object>, attr: string): number {
	return arr.reduce(
		(acc: number, obj: any): number => {
			return acc + obj[attr];
		},
	0);
}
