import { useState, useEffect } from 'react';
import useTextStore from './store/useTextStore';
import './App.css';

type Category = 'Home' | 'Work' | 'Errands' | 'Personal' | 'Health' | 'Finance';

const CATEGORIES: { name: Category; color: string; icon: string }[] = [
	{ name: 'Home', color: '#4CAF50', icon: '🏠' },
	{ name: 'Work', color: '#2196F3', icon: '💼' },
	{ name: 'Errands', color: '#FF9800', icon: '🛒' },
	{ name: 'Personal', color: '#9C27B0', icon: '👤' },
	{ name: 'Health', color: '#F44336', icon: '❤️' },
	{ name: 'Finance', color: '#4CAF50', icon: '💰' },
];

function App() {
	// Local state for the text currently being typed
	const [currentText, setCurrentText] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [showReminderPicker, setShowReminderPicker] = useState(false);
	const [selectedReminder, setSelectedReminder] = useState<string | undefined>(undefined);
	const [customDate, setCustomDate] = useState('');
	const [customTime, setCustomTime] = useState('00:00');
	const [showCategoryPicker, setShowCategoryPicker] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

	// Global state from our Zustand store
	const { savedTexts, addText, deleteText, toggleComplete, updateText } = useTextStore();

	// Parse hashtags from text to auto-detect categories
	useEffect(() => {
		const hashtags = currentText.match(/#(\w+)/g);
		if (hashtags) {
			const tag = hashtags[0].slice(1).toLowerCase();
			const matchedCategory = CATEGORIES.find(cat => cat.name.toLowerCase() === tag);
			if (matchedCategory && selectedCategory !== matchedCategory.name) {
				setSelectedCategory(matchedCategory.name);
			}
		}
	}, [currentText]);

	const handleAdd = () => {
		if (currentText.trim()) {
			// Remove hashtags from text before saving
			const cleanText = currentText.replace(/#\w+/g, '').trim();

			if (editingId) {
				// Update existing task
				updateText(editingId, cleanText, selectedReminder, selectedCategory);
				setEditingId(null);
			} else {
				// Add new task
				addText(cleanText, selectedReminder, selectedCategory);
			}
			setCurrentText(''); // Clear the input for the next entry
			setSelectedReminder(undefined);
			setSelectedCategory(undefined);
			setCustomDate('');
			setCustomTime('00:00');
		}
	};

	const handleEdit = (id: string, text: string, reminder?: string, category?: Category) => {
		setCurrentText(text);
		setEditingId(id);
		setSelectedReminder(reminder);
		setSelectedCategory(category);
		// Focus and scroll to input
		setTimeout(() => {
			const input = document.querySelector('.input-container input') as HTMLInputElement;
			if (input) {
				input.focus();
				input.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	};

	const handleDelete = (id: string) => {
		setDeleteConfirmId(id);
	};

	const confirmDelete = () => {
		if (deleteConfirmId) {
			deleteText(deleteConfirmId);
			setDeleteConfirmId(null);
		}
	};

	const cancelDelete = () => {
		setDeleteConfirmId(null);
	};

	const setQuickReminder = (type: 'laterToday' | 'tomorrowMorning' | 'thisWeekend') => {
		const now = new Date();
		let reminderDate: Date;

		switch (type) {
			case 'laterToday':
				reminderDate = new Date(now);
				reminderDate.setHours(17, 0, 0, 0); // 5:00 PM today
				break;
			case 'tomorrowMorning':
				reminderDate = new Date(now);
				reminderDate.setDate(now.getDate() + 1);
				reminderDate.setHours(9, 0, 0, 0); // 9:00 AM tomorrow
				break;
			case 'thisWeekend':
				reminderDate = new Date(now);
				const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
				reminderDate.setDate(now.getDate() + daysUntilSaturday);
				reminderDate.setHours(10, 0, 0, 0); // 10:00 AM Saturday
				break;
		}

		setSelectedReminder(reminderDate.toISOString());
		setShowReminderPicker(false);
	};

	const setCustomReminder = () => {
		if (customDate && customTime) {
			const reminderDate = new Date(`${customDate}T${customTime}`);
			setSelectedReminder(reminderDate.toISOString());
			setShowReminderPicker(false);
		}
	};

	const clearReminder = () => {
		setSelectedReminder(undefined);
		setCustomDate('');
		setCustomTime('00:00');
		setShowReminderPicker(false);
	};

	const getCategoryColor = (categoryName?: Category) => {
		if (!categoryName) return '#999';
		return CATEGORIES.find(cat => cat.name === categoryName)?.color || '#999';
	};

	const getCategoryIcon = (categoryName?: Category) => {
		if (!categoryName) return '';
		return CATEGORIES.find(cat => cat.name === categoryName)?.icon || '';
	};

	const formatReminderTime = (isoString: string) => {
		const date = new Date(isoString);
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();
		const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

		const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

		if (isToday) return `Today, ${timeStr}`;
		if (isTomorrow) return `Tomorrow, ${timeStr}`;

		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	};

	const getReminderUrgency = (isoString: string) => {
		const reminderTime = new Date(isoString);
		const now = new Date();
		const diffMs = reminderTime.getTime() - now.getTime();
		const diffHours = diffMs / (1000 * 60 * 60);

		if (diffMs < 0) return 'overdue'; // Past due
		if (diffHours <= 1) return 'urgent'; // Within 1 hour
		return 'normal';
	};

	// Sort tasks: incomplete first, then completed
	const sortedTasks = [...savedTexts].sort((a, b) => {
		if (a.completed === b.completed) return 0;
		return a.completed ? 1 : -1;
	});

	// Calculate task statistics
	const totalTasks = savedTexts.length;
	const completedTasks = savedTexts.filter(task => task.completed).length;
	const incompleteTasks = totalTasks - completedTasks;
	const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

	// Get current date for header
	const today = new Date();
	const dateString = today.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	return (
		<div className="app">
			<div className="header">
				<h1>Daily Focus</h1>
				<p className="header-date">{dateString}</p>
			</div>

			{/* Input form for adding new text */}
			<div className="input-wrapper">
				<div className="input-container">
					<input
						type="text"
						value={currentText}
						onChange={(e) => setCurrentText(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAdd()}
						placeholder="What do you need to do?"
						maxLength={500}
					/>
					<button
						className="reminder-btn"
						onClick={() => {
							setShowReminderPicker(!showReminderPicker);
							setShowCategoryPicker(false);
						}}
						title="Set reminder"
					>
						🔔
					</button>
					<button
						className="category-btn"
						onClick={() => {
							setShowCategoryPicker(!showCategoryPicker);
							setShowReminderPicker(false);
						}}
						title="Set category"
					>
						🏷️
					</button>
					<button onClick={handleAdd}>{editingId ? 'UPDATE' : 'ADD TASK'}</button>
				</div>

				{/* Category and Reminder Info Below Input */}
				{(selectedCategory || selectedReminder) && (
					<div className="input-meta">
						{selectedCategory && (
							<div
								className="selected-category"
								style={{ backgroundColor: getCategoryColor(selectedCategory) }}
							>
								<span>#{selectedCategory.toLowerCase()}</span>
								<button
									className="meta-remove"
									onClick={() => setSelectedCategory(undefined)}
								>
									✕
								</button>
							</div>
						)}
						{selectedReminder && (
							<div className="selected-reminder">
								<span>⏰ {formatReminderTime(selectedReminder)}</span>
								<button className="meta-remove" onClick={clearReminder}>✕</button>
							</div>
						)}
					</div>
				)}

				{currentText.length === 500 && (
					<p className="limit-warning">Turn big goals into bite-sized wins. Max 500 symbols.</p>
				)}

				{/* Reminder Picker Popup */}
				{showReminderPicker && (
					<div className="reminder-popup">
						<div className="reminder-header">
							<h3>Set Reminder</h3>
							<button className="close-popup" onClick={() => setShowReminderPicker(false)}>✕</button>
						</div>
						<div className="quick-reminders">
							<button onClick={() => setQuickReminder('laterToday')}>Later Today (5:00 PM)</button>
							<button onClick={() => setQuickReminder('tomorrowMorning')}>Tomorrow Morning (9:00 AM)</button>
							<button onClick={() => setQuickReminder('thisWeekend')}>This Weekend</button>
						</div>
						<div className="custom-reminder">
							<label>Custom:</label>
							<input
								type="date"
								value={customDate}
								onChange={(e) => setCustomDate(e.target.value)}
							/>
							<input
								type="time"
								value={customTime}
								onChange={(e) => setCustomTime(e.target.value)}
							/>
							<button onClick={setCustomReminder} disabled={!customDate}>Set</button>
						</div>
					</div>
				)}

				{/* Category Picker Popup */}
				{showCategoryPicker && (
					<div className="category-popup">
						<div className="category-header">
							<h3>Choose Category</h3>
							<button className="close-popup" onClick={() => setShowCategoryPicker(false)}>✕</button>
						</div>
						<div className="category-list">
							{CATEGORIES.map((cat) => (
								<button
									key={cat.name}
									className="category-option"
									style={{ borderLeftColor: cat.color }}
									onClick={() => {
										setSelectedCategory(cat.name);
										setShowCategoryPicker(false);
									}}
								>
									<span className="category-icon">{cat.icon}</span>
									<span className="category-name">{cat.name}</span>
								</button>
							))}
						</div>
						<p className="category-tip">💡 Tip: Type #{CATEGORIES[0].name.toLowerCase()} in your task to auto-tag!</p>
					</div>
				)}
			</div>

			{/* Display the list of saved texts */}
			{sortedTasks.length > 0 && (
				<div className="tasks-section">
					<div className="task-progress">
						<div className="task-counter">
							<span className="incomplete-count">{incompleteTasks}</span>
							<span className="task-separator"> / </span>
							<span className="total-count">{totalTasks}</span>
						</div>
						<div className="progress-bar">
							<div
								className="progress-fill"
								style={{ width: `${completionPercentage}%` }}
							></div>
						</div>
					</div>
					<h2>My Focus List:</h2>
					<div className="saved-texts">
						{sortedTasks.map((task) => (
							<div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
								<input
									type="checkbox"
									className="task-checkbox"
									checked={task.completed}
									onChange={() => toggleComplete(task.id)}
								/>
								<div className="task-content">
									<div className="task-text-wrapper">
										<p className="task-text">{task.text}</p>
										{(task.category || task.reminder) && (
											<div className="task-meta">
												{task.category && (
													<span
														className="task-category-tag"
														style={{ backgroundColor: getCategoryColor(task.category) }}
													>
														#{task.category.toLowerCase()}
													</span>
												)}
												{task.reminder && (
													<span className={`task-reminder ${getReminderUrgency(task.reminder)}`}>
														⏰ {formatReminderTime(task.reminder)}
													</span>
												)}
											</div>
										)}
									</div>
								</div>
								<div className="task-actions">
									<button
										className="action-btn edit-btn"
										onClick={() => handleEdit(task.id, task.text, task.reminder, task.category)}
										title="Edit task"
									>
										✏️
									</button>
									<button
										className="action-btn delete-btn"
										onClick={() => handleDelete(task.id)}
										title="Delete task"
									>
										🗑️
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			{deleteConfirmId && (
				<div className="modal-overlay" onClick={cancelDelete}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h3>Delete Task?</h3>
						<p>Do you want to delete this task?</p>
						<div className="modal-actions">
							<button className="modal-btn yes-btn" onClick={confirmDelete}>
								Yes
							</button>
							<button className="modal-btn no-btn" onClick={cancelDelete}>
								No
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
