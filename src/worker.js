import { find_sol } from './dlx';

function get_no_errors() {
	return [
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
	];
}

onmessage = (event) => {
	console.log('Recieved message');
	const action = JSON.parse(event.data.jsondat);
	console.log(action);
	let sols = undefined;
	let errors = get_no_errors();
	let r;
	try {
		r = find_sol(action.newg);
		if (r.sol !== undefined) {
			sols = r.sol;
		} else if (r.errors !== undefined) {
			//highlight the wrong nums
			if (r.errors.length === 0) {
				errors.forEach((t) => {
					for (let i = 0; i < t.length; i++) {
						t[i] = 1;
					}
				});
			} else {
				r.errors.forEach(({ row, col }) => {
					errors[row][col] = 1;
				});
			}
		} else {
			console.log('Too few clues to solve');
			errors = errors.map((t) => t.map((_r) => 1));
		}
	} catch (ex) {
		console.log('Too few clues to solve');
		errors = errors.map((t) => t.map((_r) => 1));
	} finally {
		postMessage({
			jsondat: JSON.stringify({
				id: action.id,
				solution: sols,
				errors: errors,
			}),
		});
	}
};
