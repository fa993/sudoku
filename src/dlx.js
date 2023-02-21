const DIM = 9;
const COL_EXTEND = 4;

//sudoku rules
//only 1 of the number 1-9 in each row column
//box rules will introduce later
//poc for 3x3 sudoku

//structure
// first row is control row
// contains down links to the contained row

function make_matrix() {
	let mat = Array.from({ length: DIM * DIM * DIM }, (_v, _i) =>
		Array.from({ length: DIM * DIM * COL_EXTEND }, (_v2, _i2) => false)
	);

	//row constraints
	for (let j = 0; j < DIM * DIM; j++) {
		for (let i = 0; i < DIM; i++) {
			mat[j * DIM + i][Math.floor(j / DIM) * DIM + i] = true;
		}
	}

	//col constraints
	for (let i = 0; i < DIM * DIM * DIM; i++) {
		let col = Math.floor(i / DIM) % DIM;
		let num = i % DIM;
		mat[i][DIM * DIM + col * DIM + num] = true;
	}

	//row-col constraints
	for (let j = 0; j < DIM * DIM; j++) {
		for (let i = 0; i < DIM; i++) {
			mat[j * DIM + i][2 * DIM * DIM + j] = true;
		}
	}

	//box-constraints
	for (let i = 0; i < DIM * DIM * DIM; i++) {
		let col = Math.floor(i / DIM) % DIM;
		let row = Math.floor(i / (DIM * DIM));
		let num = i % DIM;
		let off = -1;
		switch (Math.floor(row / 3) * 10 + Math.floor(col / 3)) {
			case 0:
				off = 0;
				break;
			case 1:
				off = 1;
				break;
			case 2:
				off = 2;
				break;
			case 10:
				off = 3;
				break;
			case 11:
				off = 4;
				break;
			case 12:
				off = 5;
				break;
			case 20:
				off = 6;
				break;
			case 21:
				off = 7;
				break;
			case 22:
				off = 8;
				break;
			default:
				throw new Error(
					'row column out of bounds or something screwed up in group resolution'
				);
		}
		mat[i][3 * DIM * DIM + num + DIM * off] = true;
	}
	return mat;
}

class SparseNode {
	right = null;
	left = null;
	up = null;
	down = null;
	header = null;
	i = -1;
	j = -1;
	row = -1;
	col = -1;
	num = 0;
	is_covered = false;

	append_right_header() {
		this.right = new SparseNode();
		this.right.left = this;
		this.right.header = this.right;
	}

	jump_to_lowest() {
		let prev = this;
		for (let n = this.down; n !== null && n !== this; prev = n, n = n.down) {}
		return prev;
	}

	populate_from_sparse_row_index(i) {
		this.col = Math.floor(i / DIM) % DIM;
		this.row = Math.floor(i / (DIM * DIM));
		this.num = i % DIM;
	}
}

class SparseMatrix {
	entryNode = null;
	selected_rows = [];
	row_po = [];
	solutions = [];
	sol_limit = 1;
	errors = [];

	constructor(mat = make_matrix()) {
		this.entryNode = new SparseNode();
		let curr = this.entryNode;
		//row constraints
		for (let i = 0; i < DIM; i++) {
			for (let j = 0; j < DIM; j++) {
				curr.append_right_header();
				curr = curr.right;
			}
		}

		//col constraints
		for (let i = 0; i < DIM; i++) {
			for (let j = 0; j < DIM; j++) {
				curr.append_right_header();
				curr = curr.right;
			}
		}

		//row-col constraints
		for (let i = 0; i < DIM; i++) {
			for (let j = 0; j < DIM; j++) {
				curr.append_right_header();
				curr = curr.right;
			}
		}

		//box constraints
		for (let i = 0; i < DIM; i++) {
			for (let j = 0; j < DIM; j++) {
				curr.append_right_header();
				curr = curr.right;
			}
		}

		curr.right = this.entryNode;
		this.entryNode.left = curr;

		for (let i = 0; i < DIM * DIM * DIM; i++) {
			let n = this.entryNode.right;
			let last_con = null;
			let first_con = null;
			for (let j = 0; j < DIM * DIM * COL_EXTEND; j++, n = n.right) {
				if (mat[i][j]) {
					let ins = new SparseNode();
					let pos = n.jump_to_lowest();
					pos.down = ins;
					ins.up = pos;
					ins.down = n;
					n.up = ins;
					ins.header = n;
					if (first_con == null) {
						first_con = ins;
						this.row_po.push(first_con);
					}
					if (last_con != null) {
						last_con.right = ins;
						ins.left = last_con;
					}
					last_con = ins;
					ins.populate_from_sparse_row_index(i);
					ins.i = i;
					ins.j = j;
					n.num++;
				}
			}
			if (first_con != null) {
				first_con.left = last_con;
				last_con.right = first_con;
			}
		}
	}

	initialise(tar) {
		for (let i = 0; i < DIM; i++) {
			for (let j = 0; j < DIM; j++) {
				let num = tar[i][j];
				if (num === -1) {
					//do nothing
					continue;
				}
				//ith row jth col
				//select columns
				//apply select operation
				this.selected_rows.push(i * DIM * DIM + j * DIM + num - 1);
				// cout << i * DIM * DIM + j * DIM + num - 1 << endl;
				let n2 = this.row_po[i * DIM * DIM + j * DIM + num - 1];
				if (n2.header.is_covered === true) {
					//already covered constraint mismatch
					this.errors.push({ row: i, col: j });
				} else {
					this.cover_entire_column(n2.header);
					n2.header.is_covered = true;
					for (let n3 = n2.right; n2 !== n3; n3 = n3.right) {
						this.cover_entire_column(n3.header);
						n3.header.is_covered = true;
					}
				}
			}
		}
	}

	cover_entire_column(min) {
		this.cover_control_column(min);
		for (let n2 = min.down; n2 !== min; n2 = n2.down) {
			for (let n3 = n2.right; n3 !== n2; n3 = n3.right) {
				this.cover_row(n3);
			}
		}
	}

	uncover_entire_column(min) {
		for (let n2 = min.up; n2 !== min; n2 = n2.up) {
			for (let n3 = n2.left; n2 !== n3; n3 = n3.left) {
				this.uncover_row(n3);
			}
		}
		this.uncover_control_col(min);
	}

	algorithm_x(genMode = false, depth = 0) {
		if (this.entryNode.right === this.entryNode) {
			//valid solution
			this.solutions.push(JSON.parse(JSON.stringify(this.selected_rows)));
			return;
		}

		let st = this.entryNode.right;
		let s = st.num;
		let min = st;
		for (st = st.right; st !== this.entryNode; st = st.right) {
			if (st.num < s) {
				min = st;
			}
		}
		if (genMode && depth < 7) {
			//get a random no from 1 to DIM * DIM * COL_EXTEND
			let jumps = Math.floor(Math.random() * 100);
			for (let i = 0; i < jumps; i++, min = min.right) {}
			if (min === this.entryNode) {
				min = min.right;
			}
		}

		//header col in min

		if (min.num === 0) {
			//Unsuccessful Match
			return;
		}

		this.cover_entire_column(min);
		for (let n2 = min.down; n2 !== min; n2 = n2.down) {
			this.selected_rows.push(n2.i);
			// cover_entire_column(n2.header);
			for (let n3 = n2.right; n2 !== n3; n3 = n3.right) {
				this.cover_entire_column(n3.header);
			}
			this.algorithm_x(genMode, depth + 1);
			if (this.solutions.length >= this.sol_limit) {
				return;
			}
			this.selected_rows.pop();
			for (let n3 = n2.left; n3 !== n2; n3 = n3.left) {
				//uncover n3.header
				this.uncover_entire_column(n3.header);
			}
			// uncover_entire_column(n2.header);
		}

		//uncover min
		this.uncover_entire_column(min);
	}

	get_sudoku_grid(v) {
		if (v === undefined || v === null) {
			return undefined;
		}
		let sol = Array.from({ length: DIM }, (_v, _i) =>
			Array.from({ length: DIM }, (_v2, _i2) => 0)
		);
		let helper = new SparseNode();
		for (let i = 0; i < v.length; i++) {
			helper.populate_from_sparse_row_index(v[i]);
			sol[helper.row][helper.col] = helper.num + 1;
		}
		return sol;
	}

	print_matches() {
		console.log('Successful Matches');
		this.solutions.forEach((v) => {
			let sol = this.get_sudoku_grid(v);
			for (let i = 0; i < DIM; i++) {
				for (let j = 0; j < DIM; j++) {
					process.stdout.write(sol[i][j].toString());
				}
				console.log();
			}
		});
	}

	cover_control_column(col) {
		col.left.right = col.right;
		col.right.left = col.left;
	}

	uncover_control_col(col) {
		col.left.right = col;
		col.right.left = col;
	}

	cover_row(row) {
		row.up.down = row.down;
		row.down.up = row.up;
		row.header.num--;
	}

	uncover_row(row) {
		row.up.down = row;
		row.down.up = row;
		row.header.num++;
	}
}

//columns 0 - DIM * DIM are row constraints
//columns DIM * DIM - 2 * DIM * DIM are col constraints
//column 2 * DIM * DIM - 3 * DIM * DIM are row-col constraints
//columns 3 * DIM * DIM - 4 * DIM * DIM are box constraints

// function testing_code() {
// 	//first construct the sparse matrix

// 	let tar = [
// 		[1, 4, 9, -1, -1, -1, -1, 2, 8],
// 		[3, -1, -1, 9, 4, 8, -1, -1, -1],
// 		[-1, -1, -1, -1, 1, 2, -1, -1, 7],
// 		[-1, 2, -1, 4, -1, 6, -1, 3, -1],
// 		[8, -1, 6, -1, -1, -1, 5, -1, 4],
// 		[9, 1, -1, -1, 5, 3, -1, -1, -1],
// 		[-1, -1, 1, 6, 3, -1, 7, 9, -1],
// 		[2, 6, -1, -1, 9, -1, 4, 1, -1],
// 		[4, 9, 3, 2, -1, -1, -1, -1, -1],
// 	];

// 	let tar2 = [
// 		[-1, -1, -1, 8, -1, 1, -1, -1, -1],
// 		[-1, -1, -1, -1, -1, -1, -1, 4, 3],
// 		[5, -1, -1, -1, -1, -1, -1, -1, -1],
// 		[-1, -1, -1, -1, 7, -1, 8, -1, -1],
// 		[-1, -1, -1, -1, -1, -1, 1, -1, -1],
// 		[-1, 2, -1, -1, 3, -1, -1, -1, -1],
// 		[6, -1, -1, -1, -1, -1, -1, 7, 5],
// 		[-1, -1, 3, 4, -1, -1, -1, -1, -1],
// 		[-1, -1, -1, 2, -1, -1, 6, -1, -1],
// 	];

// 	m = new SparseMatrix();

// 	m.initialise(tar);
// 	m.algorithm_x();
// 	m.print_matches();

// 	m = new SparseMatrix();
// 	m.initialise(tar2);
// 	m.algorithm_x();
// 	m.print_matches();

// 	return 0;
// }

function find_sol(tar) {
	let m = new SparseMatrix();

	m.initialise(tar);
	if (m.errors.length === 0) {
		m.algorithm_x();
		return { sol: m.get_sudoku_grid(m.solutions[0]) };
	} else {
		return { errors: m.errors };
	}
}

function create_puzzle() {
	let m = new SparseMatrix();
	m.algorithm_x(true);
	return m.get_sudoku_grid(m.solutions[0]);
}

// create_puzzle();

export { find_sol, create_puzzle };

// testing_code();
