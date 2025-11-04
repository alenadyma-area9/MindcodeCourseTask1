import { useState, useEffect } from 'react';
import useTextStore from './store/useTextStore';
import './App.css';

type Category = 'Home' | 'Work' | 'Errands' | 'Personal' | 'Health' | 'Finance';
type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';

const CATEGORIES: { name: Category; color: string; icon: string }[] = [
	{ name: 'Home', color: '#66D9AD', icon: '🏠' },
	{ name: 'Work', color: '#6A5ACD', icon: '💼' },
	{ name: 'Errands', color: '#FF9800', icon: '🛒' },
	{ name: 'Personal', color: '#9C27B0', icon: '👤' },
	{ name: 'Health', color: '#F44336', icon: '❤️' },
	{ name: 'Finance', color: '#3CB371', icon: '💰' },
];

function App() {
	// Local state for the text currently being typed
	const [currentText, setCurrentText] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [showReminderPicker, setShowReminderPicker] = useState(false);
	const [selectedReminder, setSelectedReminder] = useState<string | undefined>(undefined);
	const [showAdvancedReminder, setShowAdvancedReminder] = useState(false);

	// Set default date to tomorrow
	const getTomorrowDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	};

	const [customDate, setCustomDate] = useState(getTomorrowDate());
	const [customTime, setCustomTime] = useState('00:00');
	const [showCategoryPicker, setShowCategoryPicker] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
	const [selectedRepeat, setSelectedRepeat] = useState<RepeatOption>('none');

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

	// Close popups when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;

			// Check if click is outside reminder popup
			if (showReminderPicker && !target.closest('.reminder-popup') && !target.closest('.meta-icon-btn') && !target.closest('.clickable-chip')) {
				setShowReminderPicker(false);
			}

			// Check if click is outside category popup
			if (showCategoryPicker && !target.closest('.category-popup') && !target.closest('.meta-icon-btn') && !target.closest('.clickable-chip')) {
				setShowCategoryPicker(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showReminderPicker, showCategoryPicker]);

	const handleAdd = () => {
		if (currentText.trim()) {
			// Remove hashtags from text before saving
			const cleanText = currentText.replace(/#\w+/g, '').trim();

			if (editingId) {
				// Update existing task
				updateText(editingId, cleanText, selectedReminder, selectedCategory, selectedReminder ? selectedRepeat : undefined);
				setEditingId(null);
			} else {
				// Add new task
				addText(cleanText, selectedReminder, selectedCategory, selectedReminder ? selectedRepeat : undefined);
			}
			setCurrentText(''); // Clear the input for the next entry
			setSelectedReminder(undefined);
			setSelectedCategory(undefined);
			setSelectedRepeat('none');
			setCustomDate(getTomorrowDate());
			setCustomTime('00:00');
		}
	};

	const handleEdit = (id: string, text: string, reminder?: string, category?: Category, repeat?: RepeatOption) => {
		setCurrentText(text);
		setEditingId(id);
		setSelectedReminder(reminder);
		setSelectedCategory(category);
		setSelectedRepeat(repeat || 'none');
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

		// If advanced settings are open, just set the date/time but don't close
		if (showAdvancedReminder) {
			const dateStr = reminderDate.toISOString().split('T')[0];
			const timeStr = reminderDate.toTimeString().slice(0, 5);
			setCustomDate(dateStr);
			setCustomTime(timeStr);
		} else {
			// If advanced settings are closed, set reminder and close dialog
			setSelectedReminder(reminderDate.toISOString());
			setShowReminderPicker(false);
		}
	};

	const setCustomReminder = () => {
		if (customDate && customTime) {
			const reminderDate = new Date(`${customDate}T${customTime}`);
			setSelectedReminder(reminderDate.toISOString());
			setShowReminderPicker(false);
			setShowAdvancedReminder(false);
		}
	};

	const clearReminder = () => {
		setSelectedReminder(undefined);
		setSelectedRepeat('none');
		setCustomDate(getTomorrowDate());
		setCustomTime('00:00');
		setShowReminderPicker(false);
		setShowAdvancedReminder(false);
	};

	const getCategoryColor = (categoryName?: Category) => {
		if (!categoryName) return '#999';
		return CATEGORIES.find(cat => cat.name === categoryName)?.color || '#999';
	};

	const getCategoryIcon = (categoryName?: Category) => {
		if (!categoryName) return '';
		return CATEGORIES.find(cat => cat.name === categoryName)?.icon || '';
	};

	const formatRepeat = (repeat?: RepeatOption) => {
		if (!repeat || repeat === 'none') return '';
		const repeatLabels = {
			daily: 'Daily',
			weekly: 'Weekly',
			monthly: 'Monthly',
			weekdays: 'Weekdays'
		};
		return ` • ${repeatLabels[repeat]}`;
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
					<button onClick={handleAdd}>{editingId ? 'UPDATE' : 'ADD TASK'}</button>
				</div>

				{/* Category and Reminder Icons + Info Below Input */}
				<div className="input-meta">
					{/* Show reminder icon OR selected reminder chip */}
					{selectedReminder ? (
						<div
							className="selected-reminder clickable-chip"
							onClick={() => {
								setShowReminderPicker(!showReminderPicker);
								setShowCategoryPicker(false);
							}}
						>
							<span>⏰ {formatReminderTime(selectedReminder)}{formatRepeat(selectedRepeat)}</span>
							<button
								className="meta-remove"
								onClick={(e) => {
									e.stopPropagation();
									clearReminder();
								}}
							>
								✕
							</button>
						</div>
					) : (
						<button
							className="meta-icon-btn"
							onClick={() => {
								setShowReminderPicker(!showReminderPicker);
								setShowCategoryPicker(false);
							}}
							title="Set reminder"
						>
							🔔
						</button>
					)}

					{/* Show category icon OR selected category chip */}
					{selectedCategory ? (
						<div
							className="selected-category clickable-chip"
							style={{ backgroundColor: getCategoryColor(selectedCategory) }}
							onClick={() => {
								setShowCategoryPicker(!showCategoryPicker);
								setShowReminderPicker(false);
							}}
						>
							<span>#{selectedCategory.toLowerCase()}</span>
							<button
								className="meta-remove"
								onClick={(e) => {
									e.stopPropagation();
									setSelectedCategory(undefined);
								}}
							>
								✕
							</button>
						</div>
					) : (
						<button
							className="meta-icon-btn"
							onClick={() => {
								setShowCategoryPicker(!showCategoryPicker);
								setShowReminderPicker(false);
							}}
							title="Set category"
						>
							🏷️
						</button>
					)}
				</div>

				{currentText.length === 500 && (
					<p className="limit-warning">Turn big goals into bite-sized wins. Max 500 symbols.</p>
				)}

				{/* Reminder Picker Popup */}
				{showReminderPicker && (
					<div className="reminder-popup">
						<div className="reminder-header">
							<h3>Reminder</h3>
							<button className="close-popup" onClick={() => { setShowReminderPicker(false); setShowAdvancedReminder(false); }}>✕</button>
						</div>

						{/* Quick Select Buttons */}
						<div className="quick-reminders">
							<button onClick={() => setQuickReminder('laterToday')}>
								<span className="quick-time">Later Today</span>
								<span className="quick-subtext">5:00 PM</span>
							</button>
							<button onClick={() => setQuickReminder('tomorrowMorning')}>
								<span className="quick-time">Tomorrow Morning</span>
								<span className="quick-subtext">9:00 AM</span>
							</button>
							<button onClick={() => setQuickReminder('thisWeekend')}>
								<span className="quick-time">This Weekend</span>
								<span className="quick-subtext">Saturday 10:00 AM</span>
							</button>
						</div>

						{/* Advanced Settings Expander */}
						<div className="advanced-expander">
							<div className="expander-separator"></div>
							<button
								className="expander-button"
								onClick={() => setShowAdvancedReminder(!showAdvancedReminder)}
							>
								<span className="expander-icon">📅</span>
								<span className="expander-label">
									{showAdvancedReminder ? 'Hide Advanced Settings' : 'Custom Time & Recurrence'}
								</span>
								<span className="expander-chevron">{showAdvancedReminder ? '▲' : '▼'}</span>
							</button>

							{showAdvancedReminder && (
								<div className="advanced-content">
									<div className="custom-datetime">
										<div className="datetime-field">
											<label>Date</label>
											<input
												type="date"
												value={customDate}
												onChange={(e) => setCustomDate(e.target.value)}
											/>
										</div>
										<div className="datetime-field">
											<label>Time</label>
											<input
												type="time"
												value={customTime}
												onChange={(e) => setCustomTime(e.target.value)}
											/>
										</div>
									</div>

									<div className="repeat-field">
										<label>Repeat</label>
										<select
											value={selectedRepeat}
											onChange={(e) => setSelectedRepeat(e.target.value as RepeatOption)}
											className="repeat-select"
										>
											<option value="none">No repeat</option>
											<option value="daily">Daily</option>
											<option value="weekdays">Weekdays (Mon-Fri)</option>
											<option value="weekly">Weekly</option>
											<option value="monthly">Monthly</option>
										</select>
									</div>

									<button
										className="set-button"
										onClick={setCustomReminder}
										disabled={!customDate}
									>
										SET
									</button>
								</div>
							)}
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
														⏰ {formatReminderTime(task.reminder)}{formatRepeat(task.repeat)}
													</span>
												)}
											</div>
										)}
									</div>
								</div>
								<div className="task-actions">
									<button
										className="action-btn edit-btn"
										onClick={() => handleEdit(task.id, task.text, task.reminder, task.category, task.repeat)}
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
