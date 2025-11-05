import { useState, useEffect } from 'react';
import useTextStore from './store/useTextStore';
import type { CategoryItem } from './store/useTextStore';
import './App.css';

type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';

const AVAILABLE_COLORS = [
	'#66D9AD', // Mint Green
	'#6A5ACD', // Slate Blue
	'#FF9800', // Orange
	'#9C27B0', // Purple
	'#F44336', // Red
	'#3CB371', // Medium Sea Green
	'#4A90E2', // Soft Blue
];

const AVAILABLE_ICONS = ['🏠', '💼', '🛒', '👤', '❤️', '💰', '📚'];

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
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
	const [selectedRepeat, setSelectedRepeat] = useState<RepeatOption>('none');
	const [showCategoryManager, setShowCategoryManager] = useState(false);
	const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategoryColor, setNewCategoryColor] = useState(AVAILABLE_COLORS[0]);
	const [newCategoryIcon, setNewCategoryIcon] = useState(AVAILABLE_ICONS[0]);
	const [showCustomIconInput, setShowCustomIconInput] = useState(false);
	const [customIconInput, setCustomIconInput] = useState('');

	// Global state from our Zustand store
	const { savedTexts, categories, addText, deleteText, toggleComplete, updateText, addCategory, updateCategory, deleteCategory } = useTextStore();

	// Parse hashtags from text to auto-detect categories
	useEffect(() => {
		const hashtags = currentText.match(/#(\w+)/g);
		if (hashtags) {
			const tag = hashtags[0].slice(1).toLowerCase();
			const matchedCategory = categories.find(cat => cat.name.toLowerCase() === tag);
			if (matchedCategory && selectedCategoryId !== matchedCategory.id) {
				setSelectedCategoryId(matchedCategory.id);
			}
		}
	}, [currentText, categories, selectedCategoryId]);

	// Close popups when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;

			// Check if click is outside reminder popup
			if (showReminderPicker && !target.closest('.reminder-popup') && !target.closest('.meta-icon-btn') && !target.closest('.clickable-chip')) {
				setShowReminderPicker(false);
				setShowAdvancedReminder(false);
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
				updateText(editingId, cleanText, selectedReminder, selectedCategoryId, selectedReminder ? selectedRepeat : undefined);
				setEditingId(null);
			} else {
				// Add new task
				addText(cleanText, selectedReminder, selectedCategoryId, selectedReminder ? selectedRepeat : undefined);
			}
			setCurrentText(''); // Clear the input for the next entry
			setSelectedReminder(undefined);
			setSelectedCategoryId(undefined);
			setSelectedRepeat('none');
			setCustomDate(getTomorrowDate());
			setCustomTime('00:00');
		}
	};

	const handleEdit = (id: string, text: string, reminder?: string, categoryId?: string, repeat?: RepeatOption) => {
		setCurrentText(text);
		setEditingId(id);
		setSelectedReminder(reminder);
		setSelectedCategoryId(categoryId);
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

	const getCategoryById = (categoryId?: string) => {
		if (!categoryId) return null;
		return categories.find(cat => cat.id === categoryId) || null;
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

	const handleSaveCategory = () => {
		if (newCategoryName.trim()) {
			// Use custom icon input if it's active and has value
			const finalIcon = showCustomIconInput && customIconInput.trim() ? customIconInput.trim() : newCategoryIcon;

			if (editingCategory) {
				updateCategory(editingCategory.id, newCategoryName.trim(), newCategoryColor, finalIcon);
			} else {
				addCategory(newCategoryName.trim(), newCategoryColor, finalIcon);
			}
			resetCategoryForm();
		}
	};

	const handleEditCategory = (category: CategoryItem) => {
		setEditingCategory(category);
		setNewCategoryName(category.name);
		setNewCategoryColor(category.color);
		setNewCategoryIcon(category.icon);
		// If it's a custom icon (not in predefined list), show it in custom input
		if (!AVAILABLE_ICONS.includes(category.icon)) {
			setShowCustomIconInput(true);
			setCustomIconInput(category.icon);
		} else {
			setShowCustomIconInput(false);
			setCustomIconInput('');
		}
	};

	const handleDeleteCategory = (id: string) => {
		if (confirm('Delete this category? It will be removed from all tasks.')) {
			deleteCategory(id);
			if (editingCategory?.id === id) {
				resetCategoryForm();
			}
		}
	};

	const resetCategoryForm = () => {
		setEditingCategory(null);
		setNewCategoryName('');
		setNewCategoryColor(AVAILABLE_COLORS[0]);
		setNewCategoryIcon(AVAILABLE_ICONS[0]);
		setShowCustomIconInput(false);
		setCustomIconInput('');
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
					{selectedCategoryId ? (() => {
						const category = getCategoryById(selectedCategoryId);
						return category ? (
							<div
								className="selected-category clickable-chip"
								style={{ backgroundColor: category.color }}
								onClick={() => {
									setShowCategoryPicker(!showCategoryPicker);
									setShowReminderPicker(false);
								}}
							>
								<span>#{category.name.toLowerCase()}</span>
								<button
									className="meta-remove"
									onClick={(e) => {
										e.stopPropagation();
										setSelectedCategoryId(undefined);
									}}
								>
									✕
								</button>
							</div>
						) : null;
					})() : (
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
							{categories.map((cat) => (
								<button
									key={cat.id}
									className="category-option"
									style={{ borderLeftColor: cat.color }}
									onClick={() => {
										setSelectedCategoryId(cat.id);
										setShowCategoryPicker(false);
									}}
								>
									<span className="category-icon">{cat.icon}</span>
									<span className="category-name">{cat.name}</span>
								</button>
							))}
						</div>
						<button
							className="manage-categories-btn"
							onClick={() => {
								setShowCategoryManager(true);
								setShowCategoryPicker(false);
							}}
						>
							⚙️ Manage Categories
						</button>
						<p className="category-tip">💡 Tip: Type #{categories[0]?.name.toLowerCase()} in your task to auto-tag!</p>
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
										{(task.categoryId || task.reminder) && (
											<div className="task-meta">
												{task.categoryId && (() => {
													const category = getCategoryById(task.categoryId);
													return category ? (
														<span
															className="task-category-tag"
															style={{ backgroundColor: category.color }}
														>
															#{category.name.toLowerCase()}
														</span>
													) : null;
												})()}
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
										onClick={() => handleEdit(task.id, task.text, task.reminder, task.categoryId, task.repeat)}
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

			{/* Category Manager Modal */}
			{showCategoryManager && (
				<div className="modal-overlay" onClick={() => { setShowCategoryManager(false); resetCategoryForm(); }}>
					<div className="category-manager-modal" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>Manage Categories</h3>
							<button className="close-popup" onClick={() => { setShowCategoryManager(false); resetCategoryForm(); }}>✕</button>
						</div>

						{/* Category Form */}
						<div className="category-form">
							<h4>{editingCategory ? 'Edit Category' : 'New Category'}</h4>

							<div className="form-field">
								<label>Name</label>
								<input
									type="text"
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									placeholder="Category name"
									maxLength={20}
								/>
							</div>

							<div className="form-field">
								<label>Icon</label>
								<div className="icon-picker">
									{AVAILABLE_ICONS.map(icon => (
										<button
											key={icon}
											className={`icon-option ${newCategoryIcon === icon ? 'selected' : ''}`}
											onClick={() => {
												setNewCategoryIcon(icon);
												setShowCustomIconInput(false);
											}}
										>
											{icon}
										</button>
									))}
									<button
										className={`icon-option custom-icon-option ${showCustomIconInput ? 'selected' : ''}`}
										onClick={() => {
											setShowCustomIconInput(true);
											if (!AVAILABLE_ICONS.includes(newCategoryIcon)) {
												setCustomIconInput(newCategoryIcon);
											}
										}}
									>
										{showCustomIconInput && customIconInput ? customIconInput : '+'}
									</button>
								</div>
								{showCustomIconInput && (
									<div className="custom-icon-input">
										<input
											type="text"
											value={customIconInput}
											onChange={(e) => setCustomIconInput(e.target.value)}
											placeholder="Paste emoji here"
											maxLength={2}
											autoFocus
										/>
									</div>
								)}
							</div>

							<div className="form-field">
								<label>Color</label>
								<div className="color-picker">
									{AVAILABLE_COLORS.map(color => (
										<button
											key={color}
											className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
											style={{ backgroundColor: color }}
											onClick={() => setNewCategoryColor(color)}
											title={color}
										/>
									))}
								</div>
							</div>

							<div className="form-actions">
								<button
									className="save-category-btn"
									onClick={handleSaveCategory}
									disabled={!newCategoryName.trim()}
								>
									{editingCategory ? 'Update' : 'Add'} Category
								</button>
								{editingCategory && (
									<button
										className="cancel-edit-btn"
										onClick={resetCategoryForm}
									>
										Cancel
									</button>
								)}
							</div>
						</div>

						{/* Existing Categories List */}
						<div className="categories-list">
							<h4>Your Categories</h4>
							{categories.map(cat => (
								<div key={cat.id} className="category-item">
									<div className="category-item-info">
										<span className="category-item-icon">
											{cat.icon}
										</span>
										<span className="category-item-chip" style={{ backgroundColor: cat.color }}>
											#{cat.name.toLowerCase()}
										</span>
									</div>
									<div className="category-item-actions">
										<button
											className="edit-category-btn"
											onClick={() => handleEditCategory(cat)}
											title="Edit"
										>
											✏️
										</button>
										<button
											className="delete-category-btn"
											onClick={() => handleDeleteCategory(cat.id)}
											title="Delete"
										>
											🗑️
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
