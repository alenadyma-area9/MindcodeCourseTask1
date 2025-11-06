import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import useTextStore from './store/useTextStore';
import type { CategoryItem } from './store/useTextStore';
import './App.css';

type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';

const REPEAT_OPTIONS = [
	{ value: 'none', label: 'No repeat' },
	{ value: 'daily', label: 'Daily' },
	{ value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
	{ value: 'weekly', label: 'Weekly' },
	{ value: 'monthly', label: 'Monthly' }
];

const AVAILABLE_COLORS = [
	'#FFC0CB',
	'#C2E0C2',
	'#AEC8C8',
	'#D8BFD8',
	'#FFD39B',
	'#CCDDEE',
	'#FFF0B5',
	'#EADFCD',
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
		return tomorrow;
	};

	const [customDate, setCustomDate] = useState<Date>(getTomorrowDate());
	const [customTime, setCustomTime] = useState('');
	const [showCategoryPicker, setShowCategoryPicker] = useState(false);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
	const [selectedRepeat, setSelectedRepeat] = useState<RepeatOption>('none');
	const [showCategoryManager, setShowCategoryManager] = useState(false);
	const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategoryColor, setNewCategoryColor] = useState(AVAILABLE_COLORS[0]);
	const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
	const [showDescription, setShowDescription] = useState(false);
	const [description, setDescription] = useState('');
	const [viewingDescription, setViewingDescription] = useState<string | null>(null);

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

			// Get description, remove if empty
			const trimmedDescription = description.trim();
			const descriptionToSave = trimmedDescription ? description : undefined;

			if (editingId) {
				// Update existing task
				updateText(editingId, cleanText, selectedReminder, selectedCategoryId, selectedReminder ? selectedRepeat : undefined, descriptionToSave);
				setEditingId(null);
			} else {
				// Add new task
				addText(cleanText, selectedReminder, selectedCategoryId, selectedReminder ? selectedRepeat : undefined, descriptionToSave);
			}
			setCurrentText(''); // Clear the input for the next entry
			setSelectedReminder(undefined);
			setSelectedCategoryId(undefined);
			setSelectedRepeat('none');
			setCustomDate(getTomorrowDate());
			setCustomTime('');
			setDescription('');
			setShowDescription(false);
		}
	};

	const handleEdit = (id: string, text: string, reminder?: string, categoryId?: string, repeat?: RepeatOption, description?: string) => {
		setCurrentText(text);
		setEditingId(id);
		setSelectedReminder(reminder);
		setSelectedCategoryId(categoryId);
		setSelectedRepeat(repeat || 'none');
		setDescription(description || '');

		// Show description editor if task has description
		if (description) {
			setShowDescription(true);
		}

		// If task has a reminder, set the date and time from it
		if (reminder) {
			const reminderDate = new Date(reminder);
			setCustomDate(reminderDate);

			// Check if time was explicitly set (seconds !== 1)
			const isTimeNotSet = reminderDate.getHours() === 9 && reminderDate.getMinutes() === 0 && reminderDate.getSeconds() === 1;
			if (isTimeNotSet) {
				setCustomTime(''); // Time wasn't set, keep it empty
			} else {
				const timeStr = reminderDate.toTimeString().slice(0, 5);
				setCustomTime(timeStr);
			}
		} else {
			// Only use defaults if no reminder
			setCustomDate(getTomorrowDate());
			setCustomTime('');
		}

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
			setCustomDate(reminderDate);
			const timeStr = reminderDate.toTimeString().slice(0, 5);
			setCustomTime(timeStr);
		} else {
			// If advanced settings are closed, set reminder and close dialog
			setSelectedReminder(reminderDate.toISOString());
			setShowReminderPicker(false);
		}
	};

	const setCustomReminder = () => {
		if (customDate) {
			const dateStr = customDate.toISOString().split('T')[0];
			let reminderDate: Date;

			if (customTime) {
				// User explicitly set time - store with 0 seconds
				reminderDate = new Date(`${dateStr}T${customTime}:00`);
			} else {
				// Time not set - use 09:00 with 1 second as marker
				reminderDate = new Date(`${dateStr}T09:00:01`);
			}

			setSelectedReminder(reminderDate.toISOString());
			setShowReminderPicker(false);
			setShowAdvancedReminder(false);
		}
	};

	const clearReminder = () => {
		setSelectedReminder(undefined);
		setSelectedRepeat('none');
		setCustomDate(getTomorrowDate());
		setCustomTime('');
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
			if (editingCategory) {
				updateCategory(editingCategory.id, newCategoryName.trim(), newCategoryColor);
			} else {
				addCategory(newCategoryName.trim(), newCategoryColor);
			}
			resetCategoryForm();
		}
	};

	const handleEditCategory = (category: CategoryItem) => {
		setEditingCategory(category);
		setNewCategoryName(category.name);
		setNewCategoryColor(category.color);
		// Focus and scroll to the name input
		setTimeout(() => {
			const nameInput = document.querySelector('.category-form input[type="text"]') as HTMLInputElement;
			if (nameInput) {
				nameInput.focus();
				// Move cursor to end of text
				nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);
				nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	};

	const handleDeleteCategory = (id: string) => {
		setDeleteCategoryId(id);
	};

	const confirmDeleteCategory = () => {
		if (deleteCategoryId) {
			deleteCategory(deleteCategoryId);
			if (editingCategory?.id === deleteCategoryId) {
				resetCategoryForm();
			}
			setDeleteCategoryId(null);
		}
	};

	const cancelDeleteCategory = () => {
		setDeleteCategoryId(null);
	};

	const resetCategoryForm = () => {
		setEditingCategory(null);
		setNewCategoryName('');
		setNewCategoryColor(AVAILABLE_COLORS[0]);
	};

	const formatReminderTime = (isoString: string) => {
		const date = new Date(isoString);
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();
		const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
		const isSameYear = date.getFullYear() === now.getFullYear();
		// Check if time was not explicitly set (marker: 09:00:01)
		const isTimeNotSet = date.getHours() === 9 && date.getMinutes() === 0 && date.getSeconds() === 1;

		const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

		// For today/tomorrow with time not set, show only the label without time
		if (isToday && isTimeNotSet) return 'Today';
		if (isTomorrow && isTimeNotSet) return 'Tomorrow';

		// For today/tomorrow with time set, show label and time
		if (isToday) return `Today, ${timeStr}`;
		if (isTomorrow) return `Tomorrow, ${timeStr}`;

		const dateFormatOptions: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		};

		// Add year if it's different from current year
		if (!isSameYear) {
			dateFormatOptions.year = 'numeric';
		}

		// Add time only if it was explicitly set by user
		if (!isTimeNotSet) {
			dateFormatOptions.hour = '2-digit';
			dateFormatOptions.minute = '2-digit';
			dateFormatOptions.hour12 = false;
		}

		return date.toLocaleDateString('en-US', dateFormatOptions);
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

	// Sort tasks:
	// 1. Incomplete with reminders (earliest first)
	// 2. Incomplete without reminders
	// 3. Completed (most recently completed first)
	const sortedTasks = [...savedTexts].sort((a, b) => {
		// Both completed - sort by completion time (most recent first)
		if (a.completed && b.completed) {
			const aTime = a.completedAt || 0;
			const bTime = b.completedAt || 0;
			return bTime - aTime; // Descending (newest first)
		}

		// One completed, one not - incomplete comes first
		if (a.completed !== b.completed) {
			return a.completed ? 1 : -1;
		}

		// Both incomplete - sort by reminder date
		const aHasReminder = !!a.reminder;
		const bHasReminder = !!b.reminder;

		// Both have reminders - sort by due date (earliest first)
		if (aHasReminder && bHasReminder) {
			const aDate = new Date(a.reminder!).getTime();
			const bDate = new Date(b.reminder!).getTime();
			return aDate - bDate; // Ascending (earliest first)
		}

		// One has reminder, one doesn't - reminder comes first
		if (aHasReminder !== bHasReminder) {
			return aHasReminder ? -1 : 1;
		}

		// Neither has reminder - maintain original order
		return 0;
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
								const isOpening = !showReminderPicker;
								setShowReminderPicker(isOpening);
								setShowCategoryPicker(false);

								// Auto-expand advanced settings if opening and has custom time or recurrence
								if (isOpening && selectedReminder) {
									const reminderDate = new Date(selectedReminder);
									// Check if time was explicitly set (seconds !== 1)
									const hasCustomTime = !(reminderDate.getHours() === 9 && reminderDate.getMinutes() === 0 && reminderDate.getSeconds() === 1);
									const hasRecurrence = selectedRepeat && selectedRepeat !== 'none';

									if (hasCustomTime || hasRecurrence) {
										setShowAdvancedReminder(true);
									}
								}
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
						>
							🔔
							<span className="meta-tooltip">Set reminder</span>
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
						>
							🏷️
							<span className="meta-tooltip">Set category</span>
						</button>
					)}

					{/* Notes/Description icon */}
					<button
						className={`meta-icon-btn ${showDescription ? 'active' : ''}`}
						onClick={() => {
							setShowDescription(!showDescription);
							setShowReminderPicker(false);
							setShowCategoryPicker(false);
						}}
					>
						📝
						<span className="meta-tooltip">Add details</span>
					</button>
				</div>

				{currentText.length === 500 && (
					<p className="limit-warning">Turn big goals into bite-sized wins. Max 500 symbols.</p>
				)}

				{/* Description/Notes Editor */}
				{showDescription && (
					<div className="description-editor">
						<label className="description-label">Details</label>
						<ReactQuill
							value={description}
							onChange={setDescription}
							modules={{
								toolbar: [
									['bold', 'italic'],
									[{ 'list': 'ordered'}, { 'list': 'bullet' }],
									['link'],
									['emoji']
								]
							}}
							formats={['bold', 'italic', 'list', 'bullet', 'link']}
							placeholder="Add details, notes, or checklist..."
							theme="snow"
						/>
					</div>
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
								<span className="quick-subtext">17:00</span>
							</button>
							<button onClick={() => setQuickReminder('tomorrowMorning')}>
								<span className="quick-time">Tomorrow Morning</span>
								<span className="quick-subtext">09:00</span>
							</button>
							<button onClick={() => setQuickReminder('thisWeekend')}>
								<span className="quick-time">This Weekend</span>
								<span className="quick-subtext">Saturday 10:00</span>
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
											<DatePicker
												selected={customDate}
												onChange={(date: Date | null) => date && setCustomDate(date)}
												dateFormat="dd/MM/yyyy"
												calendarStartDay={1}
												className="date-picker-input"
												popperPlacement="bottom-start"
												popperProps={{
													strategy: "fixed"
												}}
											/>
										</div>
										<div className="datetime-field">
											<label>Time (optional)</label>
											<div className="time-picker-custom">
												<Select
													value={customTime ? { value: customTime.split(':')[0], label: customTime.split(':')[0] } : { value: '', label: 'HH' }}
													onChange={(option) => {
														if (option && option.value === '') {
															// Empty option selected - clear the time
															setCustomTime('');
														} else if (option) {
															const minutes = customTime ? customTime.split(':')[1] : '00';
															setCustomTime(`${option.value}:${minutes}`);
														}
													}}
													options={[
														{ value: '', label: '--' },
														...Array.from({ length: 24 }, (_, i) => {
															const hour = i.toString().padStart(2, '0');
															return { value: hour, label: hour };
														})
													]}
													className="time-select-container"
													classNamePrefix="time-select"
													isSearchable={true}
													menuPlacement="auto"
													placeholder="HH"
													filterOption={(option, inputValue) => {
														if (!inputValue) return true;
														if (option.value === '') return false; // Hide empty option when typing
														const numInput = parseInt(inputValue);
														const numOption = parseInt(option.value);
														return !isNaN(numInput) && numOption === numInput;
													}}
													onInputChange={(inputValue, { action }) => {
														if (action === 'input-change') {
															const num = parseInt(inputValue);
															if (!isNaN(num) && num >= 0 && num <= 23) {
																const hour = num.toString().padStart(2, '0');
																const minutes = customTime ? customTime.split(':')[1] : '00';
																setCustomTime(`${hour}:${minutes}`);
															}
														}
													}}
												/>
												<span className="time-separator">:</span>
												<Select
													value={customTime ? { value: customTime.split(':')[1], label: customTime.split(':')[1] } : { value: '', label: 'MM' }}
													onChange={(option) => {
														if (option && option.value === '') {
															// Empty option selected - clear the time
															setCustomTime('');
														} else if (option) {
															const hours = customTime ? customTime.split(':')[0] : '09';
															setCustomTime(`${hours}:${option.value}`);
														}
													}}
													options={[
														{ value: '', label: '--' },
														...Array.from({ length: 60 }, (_, i) => {
															const minute = i.toString().padStart(2, '0');
															return { value: minute, label: minute };
														})
													]}
													className="time-select-container"
													classNamePrefix="time-select"
													isSearchable={true}
													menuPlacement="auto"
													placeholder="MM"
													filterOption={(option, inputValue) => {
														if (!inputValue) return true;
														if (option.value === '') return false; // Hide empty option when typing
														const numInput = parseInt(inputValue);
														const numOption = parseInt(option.value);
														return !isNaN(numInput) && numOption === numInput;
													}}
													onInputChange={(inputValue, { action }) => {
														if (action === 'input-change') {
															const num = parseInt(inputValue);
															if (!isNaN(num) && num >= 0 && num <= 59) {
																const minute = num.toString().padStart(2, '0');
																const hours = customTime ? customTime.split(':')[0] : '09';
																setCustomTime(`${hours}:${minute}`);
															}
														}
													}}
												/>
											</div>
										</div>
									</div>

									<div className="repeat-field">
										<label>Repeat</label>
										<Select
											value={REPEAT_OPTIONS.find(opt => opt.value === selectedRepeat)}
											onChange={(option) => option && setSelectedRepeat(option.value as RepeatOption)}
											options={REPEAT_OPTIONS}
											className="repeat-select-container"
											classNamePrefix="repeat-select"
											isSearchable={false}
											menuPlacement="auto"
										/>
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
									style={{ borderLeftColor: cat.color, backgroundColor: cat.color }}
									onClick={() => {
										setSelectedCategoryId(cat.id);
										setShowCategoryPicker(false);
									}}
								>
									<span className="category-name">#{cat.name.toLowerCase()}</span>
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
								<div className="checkbox-wrapper">
									<input
										type="checkbox"
										className="task-checkbox"
										checked={task.completed}
										onChange={() => toggleComplete(task.id)}
									/>
									<span className="checkbox-tooltip">
										{task.completed ? 'Mark as undone' : 'Mark as done'}
									</span>
								</div>
								<div className="task-content">
									<div className="task-text-wrapper">
										<p className="task-text">{task.text}</p>
										{(task.categoryId || task.reminder || task.description) && (
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
												{task.description && (
													<button
														className="task-notes-icon"
														onClick={() => setViewingDescription(task.description || null)}
													>
														📝
														<span className="notes-tooltip">View details</span>
													</button>
												)}
											</div>
										)}
									</div>
								</div>
								<div className="task-actions">
									<button
										className="action-btn edit-btn"
										onClick={() => handleEdit(task.id, task.text, task.reminder, task.categoryId, task.repeat, task.description)}
									>
										✏️
										<span className="action-tooltip">Edit task</span>
									</button>
									<button
										className="action-btn delete-btn"
										onClick={() => handleDelete(task.id)}
									>
										🗑️
										<span className="action-tooltip">Delete task</span>
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Delete Task Confirmation Dialog */}
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

			{/* Delete Category Confirmation Dialog */}
			{deleteCategoryId && (
				<div className="modal-overlay delete-confirm-overlay" onClick={cancelDeleteCategory}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h3>Delete Category?</h3>
						<p>This category will be removed from all tasks using it.</p>
						<div className="modal-actions">
							<button className="modal-btn yes-btn" onClick={confirmDeleteCategory}>
								Yes
							</button>
							<button className="modal-btn no-btn" onClick={cancelDeleteCategory}>
								No
							</button>
						</div>
					</div>
				</div>
			)}

			{/* View Description Modal */}
			{viewingDescription && (
				<div className="modal-overlay" onClick={() => setViewingDescription(null)}>
					<div className="description-modal" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>Task Details</h3>
							<button className="close-popup" onClick={() => setViewingDescription(null)}>✕</button>
						</div>
						<div className="description-content" dangerouslySetInnerHTML={{ __html: viewingDescription }} />
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
								<input
									type="text"
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									placeholder="Enter category name (e.g., Errands)"
									maxLength={20}
								/>
							</div>

							<div className="form-field">
								<div className="color-picker-grid">
									{AVAILABLE_COLORS.map(color => (
										<button
											key={color}
											className={`color-box ${newCategoryColor === color ? 'selected' : ''}`}
											style={{ backgroundColor: color }}
											onClick={() => setNewCategoryColor(color)}
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
										<span className="category-item-chip" style={{ backgroundColor: cat.color }}>
											#{cat.name.toLowerCase()}
										</span>
									</div>
									<div className="category-item-actions">
										<button
											className="edit-category-btn"
											onClick={() => handleEditCategory(cat)}
										>
											✏️
											<span className="category-action-tooltip">Edit</span>
										</button>
										<button
											className="delete-category-btn"
											onClick={() => handleDeleteCategory(cat.id)}
										>
											🗑️
											<span className="category-action-tooltip">Delete</span>
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
