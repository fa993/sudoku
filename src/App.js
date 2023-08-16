import './App.css';
import { useState, React, useEffect } from 'react';
import { create_puzzle } from './dlx';
import { v4 as uuidv4 } from 'uuid';

function isSudokuDigit(r) {
	return r <= 9 && r > 0;
}

function sudokuBoxBorderResolutionMap(index) {
	//set green border for corners of boxes
	let styleMap = {};
	// CSSProperties
	let row = Math.floor(index / 9);
	let col = index % 9;

	if (row === 0 || row === 3 || row === 6) {
		styleMap['borderTop'] = '1px solid green';
	}
	if (row === 8 || row === 2 || row === 5) {
		styleMap['borderBottom'] = '1px solid green';
	}
	if (col === 0 || col === 6 || col === 3) {
		styleMap['borderLeft'] = '1px solid green';
	}
	if (col === 8 || col === 2 || col === 5) {
		styleMap['borderRight'] = '1px solid green';
	}
	return styleMap;
}

function SudokuBox({ index, num, setNum, isError }) {
	return (
		<div
			style={sudokuBoxBorderResolutionMap(index)}
			className={'sudoku-cell sudoku-square' + (isError ? ' sudoku-error' : '')}
			tabIndex={index}
			onKeyDown={(e) => setNum(isSudokuDigit(e.key) ? e.key : '-1')}
		>
			<div
				style={{
					textAlign: 'center',
					visibility: isSudokuDigit(num) ? 'visible' : 'hidden',
				}}
			>
				{num}
			</div>
		</div>
	);
}

function SudokuGrid({ vals, errors, handleNewVal, isTogglingSol }) {
	const cells = [];
	for (let i = 0; i < 81; i++) {
		const row = Math.floor(i / 9);
		const col = i % 9;
		cells.push(
			<SudokuBox
				key={i}
				index={i}
				num={vals[row][col]}
				isError={errors[row][col] === 1 && isTogglingSol}
				setNum={(d) => {
					handleNewVal((prevVals) => {
						let newVals = JSON.parse(JSON.stringify(prevVals));
						newVals[row][col] = Number(d);
						return newVals;
					});
				}}
			/>
		);
	}

	return <div className='sudoku-grid'>{cells}</div>;
}

function SudokuSolutionButton({
	onPointerDownHandler,
	onPointerUpHandler,
	busy,
}) {
	return (
		<div className='sudoku-button'>
			<button
				onPointerDown={onPointerDownHandler}
				onPointerUp={onPointerUpHandler}
			>
				{busy ? 'Calculating solution... please wait' : 'Reveal Solution'}
			</button>
		</div>
	);
}

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

const worker = new Worker(new URL('./worker.js', import.meta.url), {
	type: 'module',
});

function gen_random_arr() {
	const numbers = Array(81)
		.fill()
		.map((_, i) => i);
	numbers.sort(() => Math.random() - 0.5);
	return numbers;
}

function get_pos_to_show(nums, clues) {
	return nums.slice(0, clues);
}

function Sudoku({ ini_sol, ini_grid }) {
	const [clues, setClues] = useState(20);
	const [vals, setVals] = useState({
		id: uuidv4(),
		grid: ini_grid,
		isTogglingSol: false,
		busy: false,
	});
	const [solVals, setSolVals] = useState({
		solution: ini_sol,
		errors: get_no_errors(),
	});
	useEffect(() => {
		const evh = (event) => {
			let ans = JSON.parse(event.data.jsondat);
			if (ans.id !== vals.id) {
				console.log('Old data discarding Exp:' + vals.id + ' Got:' + ans.id);
				return;
			}
			setSolVals({
				solution: ans.solution,
				errors: ans.errors,
			});
			setVals({ ...vals, busy: false });
		};
		worker.addEventListener('message', evh);
		return () => worker.removeEventListener('message', evh);
	});
	return (
		<div className='app'>
			<SudokuGrid
				vals={
					vals.isTogglingSol && solVals.solution !== undefined && !vals.busy
						? solVals.solution
						: vals.grid
				}
				isTogglingSol={vals.isTogglingSol}
				errors={solVals.errors}
				handleNewVal={(nv) => {
					setVals((prevVals) => {
						let newg = nv(prevVals.grid);
						let newid = uuidv4();
						worker.postMessage({
							jsondat: JSON.stringify({ ...solVals, newg: newg, id: newid }),
						});
						return {
							busy: true,
							id: newid,
							grid: newg,
							isTogglingSol: prevVals.isTogglingSol,
						};
					});
				}}
			/>
			<div className='customizer'>
				<SudokuSolutionButton
					onPointerDownHandler={() => {
						setVals((prevVals) => {
							return { ...prevVals, isTogglingSol: true };
						});
					}}
					onPointerUpHandler={() => {
						setVals((prevVals) => {
							return { ...prevVals, isTogglingSol: false };
						});
					}}
					busy={vals.busy}
				/>
				<button
					onClick={(e) => {
						const nums = gen_random_arr();
						const posses = get_pos_to_show(nums, clues);
						const ini_sol = create_puzzle();
						const ini_grid = ini_sol.map((t, i) =>
							t.map((tin, j) => (posses.includes(i * 9 + j) ? tin : -1))
						);
						setVals({
							id: uuidv4(),
							grid: ini_grid,
							isTogglingSol: false,
							busy: false,
						});
						setSolVals({
							solution: ini_sol,
							errors: get_no_errors(),
						});
					}}
				>
					New Game
				</button>
				<input
					type='number'
					value={clues}
					onChange={(e) => {
						setClues(Number(e.target.value));
					}}
				/>
				<button
					onClick={(e) => {
						setVals((prevVals) => {
							let posses = prevVals.grid
								.map((t, i) =>
									t
										.map((t4, j2) => {
											return { val: t4, ind: j2 };
										})
										.filter((t3) => t3.val === -1)
										.map((t2) => i * 9 + t2.ind)
								)
								.reduce((a, e) => a.concat(e), []);
							if (posses.length === 0) {
								return prevVals;
							}
							posses.sort(() => Math.random() - 0.5);
							let num = get_pos_to_show(posses, 1)[0];
							let newg = JSON.parse(JSON.stringify(prevVals.grid));
							newg[Math.floor(num / 9)][num % 9] =
								solVals.solution[Math.floor(num / 9)][num % 9];
							return {
								...prevVals,
								grid: newg,
							};
						});
					}}
				>
					Reveal A Clue
				</button>
			</div>
		</div>
	);
}

function App() {
	const cl = 20;
	const nums = gen_random_arr();
	const posses = get_pos_to_show(nums, cl);
	const ini_sol = create_puzzle();
	const ini_grid = ini_sol.map((t, i) =>
		t.map((tin, j) => (posses.includes(i * 9 + j) ? tin : -1))
	);
	return (
		<div>
			<Sudoku ini_sol={ini_sol} ini_grid={ini_grid} />
			<div className='customizer'></div>
		</div>
	);
}

export default App;
