import './App.css';
import { useState } from 'react';

function App() {
	return <SudokuGrid />;
}

// function SudokuTable({props}) {
//   const rows = []
//   for(let i = 0; i < 9; i++) {
//     rows.push(<SudokuRow key={i} />)
//   }
//   return (
//     <div style={{margin: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
//       {rows}
//     </div>
//   );
// }

// function SudokuRow({props}) {
//   const cells = []
//   for(let i = 0; i < 9; i++) {
//     cells.push(<SudokuBox key={i} num={i}/>)
//   }
//   return (
//     <div style={{display: 'flex' , justifyContent: 'center'}}>
//       {cells}
//     </div>
//   );
// }

function isDigit(r) {
	return (
		r === '1' ||
		r === '2' ||
		r === '3' ||
		r === '4' ||
		r === '5' ||
		r === '6' ||
		r === '7' ||
		r === '8' ||
		r === '9'
	);
}

function SudokuBox({ index }) {
	const [num, setNum] = useState(' ');
	return (
		<div
			className='sudoku-cell sudoku-square'
			tabIndex={index}
			onKeyDown={(e) => setNum(isDigit(e.key) ? e.key : ' ')}
		>
			<div
				style={{
					textAlign: 'center',
					visibility: isDigit(num) ? 'visible' : 'hidden',
				}}
			>
				{num}
			</div>
		</div>
	);
}

function SudokuGrid() {
	const cells = [];
	for (let i = 0; i < 81; i++) {
		cells.push(<SudokuBox key={i} index={i} />);
	}
	return <div className='sudoku-grid'>{cells}</div>;
}

export default App;
