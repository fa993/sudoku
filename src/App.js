import './App.css';
import { useState, React } from 'react';
import { find_sol, create_puzzle } from './dlx';

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

function SudokuSolutionButton({ onPointerDownHandler, onPointerUpHandler }) {
	return (
		<div className='sudoku-button'>
			<button
				onPointerDown={onPointerDownHandler}
				onPointerUp={onPointerUpHandler}
			>
				Reveal Solution
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

function Sudoku({ ini_sol, ini_grid }) {
	const [vals, setVals] = useState({
		solution: ini_sol,
		errors: get_no_errors(),
		grid: ini_grid,
		isTogglingSol: false,
	});
	return (
		<div className='app'>
			<SudokuGrid
				vals={
					vals.isTogglingSol && vals.solution !== undefined
						? vals.solution
						: vals.grid
				}
				isTogglingSol={vals.isTogglingSol}
				errors={vals.errors}
				handleNewVal={(nv) => {
					setVals((prevVals) => {
						let newg = nv(prevVals.grid);
						let sols = undefined;
						let errors = get_no_errors();
						let r;
						try {
							r = find_sol(newg);
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
							return {
								grid: newg,
								solution: sols,
								errors: errors,
								isTogglingSol: prevVals.isTogglingSol,
							};
						}
					});
				}}
			/>
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
			/>
		</div>
	);
}

function App() {
	const ini_val = create_puzzle();
	const ini_g = ini_val.map((t) =>
		t.map((e) => (Math.floor(Math.random() * 4) !== 3 ? -1 : e))
	);
	return <Sudoku ini_grid={ini_g} ini_sol={ini_val} />;
}

export default App;
