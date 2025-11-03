import { useState } from 'react';
import useTextStore from './store/useTextStore';
import './App.css';

function App() {
	// Local state for the text currently being typed
	const [currentText, setCurrentText] = useState('');

	// Global state from our Zustand store
	const { savedTexts, addText } = useTextStore();

	const handleAdd = () => {
		if (currentText.trim()) {
			addText(currentText);
			setCurrentText(''); // Clear the input for the next entry
		}
	};

	return (
		<div className="app">
			<h1>My TODO List</h1>

			{/* Input form for adding new text */}
			<div className="input-container">
				<input
					type="text"
					value={currentText}
					onChange={(e) => setCurrentText(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAdd()}
					placeholder="What do you need to do?"
				/>
				<button onClick={handleAdd} title="Press Ctrl+Enter to add task">ADD</button>
			</div>

			{/* Display the list of saved texts */}
			<div className="saved-texts">
				{savedTexts.map((text, index) => (
					<p key={index}>{text}</p>
				))}
			</div>
		</div>
	);
}

export default App;
