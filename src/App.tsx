import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import RichTextEditor, { formatTextToHtml } from './components/RichTextEditor';
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
	const [showDescriptionModal, setShowDescriptionModal] = useState(false);
	const [description, setDescription] = useState('');
	const [tempDescription, setTempDescription] = useState('');
	const [viewingTask, setViewingTask] = useState<string | null>(null);

	// Editing state for task details popup
	const [editingTaskTitle, setEditingTaskTitle] = useState('');
	const [editingTaskDescription, setEditingTaskDescription] = useState('');
	const [editingTaskReminder, setEditingTaskReminder] = useState<string | undefined>(undefined);
	const [editingTaskCategory, setEditingTaskCategory] = useState<string | undefined>(undefined);
	const [editingTaskRepeat, setEditingTaskRepeat] = useState<RepeatOption>('none');
	const [showReminderPickerInPopup, setShowReminderPickerInPopup] = useState(false);
	const [showCategoryPickerInPopup, setShowCategoryPickerInPopup] = useState(false);
	const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
	const [currentView, setCurrentView] = useState<'dates' | 'recent' | 'categories' | 'repeating' | 'archived'>('dates');
	const [showViewDropdown, setShowViewDropdown] = useState(false);
	const [showMoreOptions, setShowMoreOptions] = useState(false);
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
	const [showDeleteAllArchivedConfirm, setShowDeleteAllArchivedConfirm] = useState(false);
	const [showArchiveAllCompletedConfirm, setShowArchiveAllCompletedConfirm] = useState(false);
	const [showMarkAllCompletedConfirm, setShowMarkAllCompletedConfirm] = useState(false);
	const [showMarkAllNotCompletedConfirm, setShowMarkAllNotCompletedConfirm] = useState(false);
	const [showUnarchiveAllConfirm, setShowUnarchiveAllConfirm] = useState(false);

	// Global state from our Zustand store
	const { savedTexts, categories, addText, deleteText, toggleComplete, archiveTask, unarchiveTask, updateText, addCategory, updateCategory, deleteCategory, reorderCategories } = useTextStore();

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

	// Initialize editing state when viewing task
	useEffect(() => {
		if (viewingTask) {
			const task = savedTexts.find(t => t.id === viewingTask);
			if (task) {
				setEditingTaskTitle(task.text);
				setEditingTaskDescription(task.description || '');
				setEditingTaskReminder(task.reminder);
				setEditingTaskCategory(task.categoryId);
				setEditingTaskRepeat(task.repeat || 'none');

				// Set custom date/time if has reminder
				if (task.reminder) {
					const reminderDate = new Date(task.reminder);
					setCustomDate(reminderDate);

					const isTimeNotSet = reminderDate.getHours() === 9 && reminderDate.getMinutes() === 0 && reminderDate.getSeconds() === 1;
					if (isTimeNotSet) {
						setCustomTime('');
					} else {
						const timeStr = reminderDate.toTimeString().slice(0, 5);
						setCustomTime(timeStr);
					}
				} else {
					setCustomDate(getTomorrowDate());
					setCustomTime('');
				}

				// Auto-expand textarea after content is set
				setTimeout(() => {
					const textarea = document.querySelector('.task-details-title-input') as HTMLTextAreaElement;
					if (textarea) {
						textarea.style.height = 'auto';
						textarea.style.height = textarea.scrollHeight + 'px';
					}
				}, 0);
			}
		}
	}, [viewingTask, savedTexts]);

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

			// Check if click is outside reminder popup in modal
			if (showReminderPickerInPopup && !target.closest('.popup-inline') && !target.closest('.meta-icon-btn') && !target.closest('.clickable-chip')) {
				setShowReminderPickerInPopup(false);
				setShowAdvancedReminder(false);
			}

			// Check if click is outside category popup in modal
			if (showCategoryPickerInPopup && !target.closest('.popup-inline') && !target.closest('.meta-icon-btn') && !target.closest('.clickable-chip')) {
				setShowCategoryPickerInPopup(false);
			}

			// Check if click is outside view dropdown
			if (showViewDropdown && !target.closest('.view-selector')) {
				setShowViewDropdown(false);
			}

			// Check if click is outside more options dropdown
			if (showMoreOptions && !target.closest('.more-options-menu')) {
				setShowMoreOptions(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showReminderPicker, showCategoryPicker, showReminderPickerInPopup, showCategoryPickerInPopup, showViewDropdown, showMoreOptions]);

	const handleAdd = () => {
		// Remove hashtags from text before saving
		const cleanText = currentText.replace(/#\w+/g, '').trim();

		// Get description, remove if empty
		const trimmedDescription = description.trim();
		const descriptionToSave = trimmedDescription ? description : undefined;

		// Allow saving if either title OR description exists
		if (cleanText || descriptionToSave) {
			// Use creation date as title if empty
			const titleToSave = cleanText || formatCreationTime(Date.now());

			if (editingId) {
				// Update existing task
				updateText(editingId, titleToSave, selectedReminder, selectedCategoryId, selectedReminder ? selectedRepeat : undefined, descriptionToSave);
				setEditingId(null);
			} else {
				// Add new task
				addText(titleToSave, selectedReminder, selectedCategoryId, selectedReminder ? selectedRepeat : undefined, descriptionToSave);
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

	const getDescriptionPreview = (description: string): string => {
		if (!description) return '';
		// Remove markdown formatting and get plain text
		let plainText = description
			.replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
			.replace(/_(.+?)_/g, '$1') // Remove italic
			.replace(/\[(.+?)\]\((.+?)\)/g, '$1') // Keep link text only
			.replace(/^[•\-\d]+[\.\s]+/gm, '') // Remove list markers
			.replace(/\n/g, ' ') // Replace line breaks with spaces
			.trim();

		// Truncate to approximately 2 lines (about 200 characters for more content)
		if (plainText.length > 200) {
			return plainText.substring(0, 200) + '...';
		}
		return plainText;
	};

	const getDescriptionTooltipPreview = (description: string): string => {
		if (!description) return 'Add details';
		// Remove markdown formatting and get plain text
		let plainText = description
			.replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
			.replace(/_(.+?)_/g, '$1') // Remove italic
			.replace(/\[(.+?)\]\((.+?)\)/g, '$1') // Keep link text only
			.replace(/^[•\-\d]+[\.\s]+/gm, '') // Remove list markers
			.replace(/\n/g, ' ') // Replace line breaks with spaces
			.trim();

		// Truncate to about 150 characters for tooltip
		if (plainText.length > 150) {
			return plainText.substring(0, 150) + '...';
		}
		return plainText;
	};

	const formatCreationTime = (timestamp?: number): string => {
		if (!timestamp) return 'New task';
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
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

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedCategoryIndex(index);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		if (draggedCategoryIndex !== null && draggedCategoryIndex !== dropIndex) {
			reorderCategories(draggedCategoryIndex, dropIndex);
		}
		setDraggedCategoryIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedCategoryIndex(null);
	};

	const toggleCategoryExpansion = (categoryId: string) => {
		setExpandedCategories(prev => {
			const newSet = new Set(prev);
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId);
			} else {
				newSet.add(categoryId);
			}
			return newSet;
		});
	};

	// Group tasks by category for the categories view
	const groupTasksByCategory = () => {
		const grouped: { categoryId: string | null; tasks: typeof sortedTasks }[] = [];

		// Add groups for each category in order
		categories.forEach(cat => {
			const categoryTasks = sortedTasks.filter(task => task.categoryId === cat.id);
			if (categoryTasks.length > 0) {
				grouped.push({ categoryId: cat.id, tasks: categoryTasks });
			}
		});

		// Add tasks without category at the end
		const noCategoryTasks = sortedTasks.filter(task => !task.categoryId);
		if (noCategoryTasks.length > 0) {
			grouped.push({ categoryId: null, tasks: noCategoryTasks });
		}

		return grouped;
	};

	// Group tasks by due date status for Default view
	const groupTasksByDueDate = () => {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const todayEnd = new Date(todayStart.getTime() + 86400000); // +24 hours

		const overdue: typeof sortedTasks = [];
		const today: typeof sortedTasks = [];
		const soon: typeof sortedTasks = [];
		const noDueDate: typeof sortedTasks = [];

		sortedTasks.forEach(task => {
			if (!task.reminder) {
				noDueDate.push(task);
			} else {
				const dueDate = new Date(task.reminder);
				if (dueDate < todayStart) {
					overdue.push(task);
				} else if (dueDate >= todayStart && dueDate < todayEnd) {
					today.push(task);
				} else {
					soon.push(task);
				}
			}
		});

		// Sort each group by due date, then by creation date
		const sortByDueDateThenCreation = (a: typeof sortedTasks[0], b: typeof sortedTasks[0]) => {
			if (a.reminder && b.reminder) {
				const dateDiff = new Date(a.reminder).getTime() - new Date(b.reminder).getTime();
				if (dateDiff !== 0) return dateDiff;
			}
			// Tie-breaker: creation date (oldest first)
			return (a.createdAt || 0) - (b.createdAt || 0);
		};

		const sortByCreation = (a: typeof sortedTasks[0], b: typeof sortedTasks[0]) => {
			return (a.createdAt || 0) - (b.createdAt || 0);
		};

		overdue.sort(sortByDueDateThenCreation);
		today.sort(sortByDueDateThenCreation);
		soon.sort(sortByDueDateThenCreation);
		noDueDate.sort(sortByCreation);

		return { overdue, today, soon, noDueDate };
	};

	const handleDeleteAllArchived = () => {
		setShowDeleteAllArchivedConfirm(true);
	};

	const confirmDeleteAllArchived = () => {
		const archivedTasks = savedTexts.filter(task => task.archived);
		archivedTasks.forEach(task => deleteText(task.id));
		setShowDeleteAllArchivedConfirm(false);
	};

	const cancelDeleteAllArchived = () => {
		setShowDeleteAllArchivedConfirm(false);
	};

	const handleArchiveAllCompleted = () => {
		setShowArchiveAllCompletedConfirm(true);
	};

	const confirmArchiveAllCompleted = () => {
		const completedTasksInCurrentView = filteredTasks.filter(task => task.completed);
		completedTasksInCurrentView.forEach(task => archiveTask(task.id));
		setShowArchiveAllCompletedConfirm(false);
	};

	const cancelArchiveAllCompleted = () => {
		setShowArchiveAllCompletedConfirm(false);
	};

	const handleMarkAllCompleted = () => {
		setShowMarkAllCompletedConfirm(true);
	};

	const confirmMarkAllCompleted = () => {
		const incompleteTasks = filteredTasks.filter(task => !task.completed);
		incompleteTasks.forEach(task => toggleComplete(task.id));
		setShowMarkAllCompletedConfirm(false);
		setShowMoreOptions(false);
	};

	const cancelMarkAllCompleted = () => {
		setShowMarkAllCompletedConfirm(false);
	};

	const handleMarkAllNotCompleted = () => {
		setShowMarkAllNotCompletedConfirm(true);
	};

	const confirmMarkAllNotCompleted = () => {
		const completedTasksInView = filteredTasks.filter(task => task.completed);
		completedTasksInView.forEach(task => toggleComplete(task.id));
		setShowMarkAllNotCompletedConfirm(false);
		setShowMoreOptions(false);
	};

	const cancelMarkAllNotCompleted = () => {
		setShowMarkAllNotCompletedConfirm(false);
	};

	const handleUnarchiveAll = () => {
		setShowUnarchiveAllConfirm(true);
	};

	const confirmUnarchiveAll = () => {
		const archivedTasks = savedTexts.filter(task => task.archived);
		archivedTasks.forEach(task => unarchiveTask(task.id));
		setShowUnarchiveAllConfirm(false);
		setShowMoreOptions(false);
	};

	const cancelUnarchiveAll = () => {
		setShowUnarchiveAllConfirm(false);
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

	// Filter tasks based on current view
	const getFilteredTasks = () => {
		switch (currentView) {
			case 'archived':
				return savedTexts.filter(task => task.archived);
			case 'repeating':
				return savedTexts.filter(task => !task.archived && task.repeat && task.repeat !== 'none');
			default:
				return savedTexts.filter(task => !task.archived);
		}
	};

	const filteredTasks = getFilteredTasks();

	// Sort tasks based on current view
	const sortedTasks = [...filteredTasks].sort((a, b) => {
		// For categories view, don't sort by completion at top level
		// (we handle it within each category group)
		if (currentView !== 'categories') {
			// First priority: incomplete tasks come before completed tasks
			if (a.completed !== b.completed) {
				return a.completed ? 1 : -1;
			}
		}

		// Within each group (undone/completed), apply view-specific sorting
		switch (currentView) {
			case 'dates':
				// Sort by reminder date (earliest first)
				const aHasReminder = !!a.reminder;
				const bHasReminder = !!b.reminder;

				if (aHasReminder && bHasReminder) {
					const aDate = new Date(a.reminder!).getTime();
					const bDate = new Date(b.reminder!).getTime();
					return aDate - bDate;
				}

				if (aHasReminder !== bHasReminder) {
					return aHasReminder ? -1 : 1;
				}

				// If both completed, sort by completion time
				if (a.completed && b.completed) {
					return (b.completedAt || 0) - (a.completedAt || 0);
				}

				return 0;

			case 'recent':
				// Sort by creation time (newest first)
				return (b.createdAt || 0) - (a.createdAt || 0);

			case 'categories':
				// Sort by category order
				const aCatIndex = a.categoryId ? categories.findIndex(c => c.id === a.categoryId) : 999;
				const bCatIndex = b.categoryId ? categories.findIndex(c => c.id === b.categoryId) : 999;

				if (aCatIndex !== bCatIndex) {
					return aCatIndex - bCatIndex;
				}

				// Within same category, incomplete before completed
				if (a.completed !== b.completed) {
					return a.completed ? 1 : -1;
				}

				// Then by creation time
				return (b.createdAt || 0) - (a.createdAt || 0);

			case 'repeating':
			case 'archived':
				// Sort by creation time (newest first)
				return (b.createdAt || 0) - (a.createdAt || 0);

			default:
				return 0;
		}
	});

	// Calculate task statistics (excluding archived tasks, for header pie chart)
	const activeTasks = savedTexts.filter(task => !task.archived);
	const totalTasks = activeTasks.length;
	const completedTasks = activeTasks.filter(task => task.completed).length;
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
				<div className="header-left">
					<h1>Daily Focus</h1>
					<p className="header-date">{dateString}</p>
				</div>
				<div className="header-right">
					{totalTasks > 0 && (
						<div className="pie-chart-container">
							<div className="pie-chart-tooltip">
								<strong>{completedTasks}</strong> of <strong>{totalTasks}</strong> tasks completed
							</div>
							<svg width="80" height="80" viewBox="0 0 80 80" className="pie-chart">
								{/* Background circle (grey) */}
								<circle
									cx="40"
									cy="40"
									r="35"
									fill="none"
									stroke="#E0E0E0"
									strokeWidth="10"
								/>
								{/* Completed portion (green) */}
								{completionPercentage > 0 && (
									<circle
										cx="40"
										cy="40"
										r="35"
										fill="none"
										stroke="#006642"
										strokeWidth="10"
										strokeDasharray={`${(completionPercentage / 100) * 220} 220`}
										strokeDashoffset="0"
										transform="rotate(-90 40 40)"
										strokeLinecap="round"
									/>
								)}
								{/* Center text */}
								<text
									x="40"
									y="40"
									textAnchor="middle"
									dominantBaseline="central"
									className="pie-chart-text"
									fontSize="18"
									fontWeight="600"
									fill="#333333"
								>
									{Math.round(completionPercentage)}%
								</text>
							</svg>
						</div>
					)}
				</div>
			</div>

			{/* Input form for adding new text */}
			<div className="input-wrapper">
				<div className="input-container">
					<input
						type="text"
						value={currentText}
						onChange={(e) => setCurrentText(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAdd()}
						placeholder="What's your next task?"
						maxLength={250}
					/>
					<button onClick={handleAdd}>{editingId ? 'UPDATE' : 'ADD TASK'}</button>
				</div>

				{/* Category and Reminder Icons + Info Below Input */}
				<div className="input-meta">
					{/* Notes/Description icon */}
					<button
						className={`meta-icon-btn ${description ? 'has-content' : ''}`}
						onClick={() => {
							setTempDescription(description);
							setShowDescriptionModal(true);
							setShowReminderPicker(false);
							setShowCategoryPicker(false);
						}}
					>
						📝
						<span className="meta-tooltip">{getDescriptionTooltipPreview(description)}</span>
					</button>

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

					{/* Reminder Picker Popup */}
					{showReminderPicker && (
					<div className="modal-overlay" onClick={() => { setShowReminderPicker(false); setShowAdvancedReminder(false); }}>
					<div className="reminder-popup" onClick={(e) => e.stopPropagation()}>
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
					</div>
				)}

				{/* Category Picker Popup */}
				{showCategoryPicker && (
					<div className="modal-overlay" onClick={() => setShowCategoryPicker(false)}>
					<div className="category-popup" onClick={(e) => e.stopPropagation()}>
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
					</div>
				)}
				</div>

				{currentText.length === 250 && (
					<p className="limit-warning">Turn big goals into bite-sized wins. Max 250 symbols.</p>
				)}
			</div>

			{/* Display the list of saved texts */}
			<div className="tasks-section">
					<div className="tasks-header">
						<div className="tasks-header-top">
							<h2>My Focus List:</h2>
							<div className="tasks-header-actions">
							<div className="more-options-menu">
								<button
									className="more-options-btn"
									onClick={() => setShowMoreOptions(!showMoreOptions)}
								>
									⋯
									<span className="more-options-tooltip">More options</span>
								</button>

								{showMoreOptions && (
									<div className="more-options-dropdown">
										{currentView !== 'archived' && incompleteTasks > 0 && (
											<button
												className="more-option"
												onClick={() => {
													handleMarkAllCompleted();
													setShowMoreOptions(false);
												}}
											>
												Mark All as Completed
											</button>
										)}
										{currentView !== 'archived' && completedTasks > 0 && (
											<button
												className="more-option"
												onClick={() => {
													handleMarkAllNotCompleted();
													setShowMoreOptions(false);
												}}
											>
												Mark All as Incomplete
											</button>
										)}
										{currentView !== 'archived' && completedTasks > 0 && (
											<button
												className="more-option"
												onClick={() => {
													handleArchiveAllCompleted();
													setShowMoreOptions(false);
												}}
											>
												Archive All Completed
											</button>
										)}
										{currentView === 'archived' && sortedTasks.length > 0 && (
											<button
												className="more-option"
												onClick={() => {
													handleUnarchiveAll();
													setShowMoreOptions(false);
												}}
											>
												Unarchive All Tasks
											</button>
										)}
										{currentView === 'archived' && sortedTasks.length > 0 && (
											<button
												className="more-option"
												onClick={() => {
													handleDeleteAllArchived();
													setShowMoreOptions(false);
												}}
											>
												Delete All Archived
											</button>
										)}
									</div>
								)}
							</div>
							<div className="view-selector">
							<button
								className="view-selector-button"
								onClick={() => setShowViewDropdown(!showViewDropdown)}
							>
								<span className="view-label">
									{currentView === 'dates' && 'Smart Sort'}
									{currentView === 'recent' && 'Recently Added'}
									{currentView === 'categories' && 'Group by Categories'}
									{currentView === 'repeating' && 'Repeating Tasks'}
									{currentView === 'archived' && 'Archived tasks'}
								</span>
								<span className="view-chevron">{showViewDropdown ? '▲' : '▼'}</span>
								<span className="view-selector-tooltip">Choose how to organize your tasks</span>
							</button>

							{showViewDropdown && (
								<div className="view-dropdown">
									<button
										className={`view-option ${currentView === 'dates' ? 'active' : ''}`}
										onClick={() => {
											setCurrentView('dates');
											setShowViewDropdown(false);
										}}
									>
										Smart Sort
									</button>
									<button
										className={`view-option ${currentView === 'recent' ? 'active' : ''}`}
										onClick={() => {
											setCurrentView('recent');
											setShowViewDropdown(false);
										}}
									>
										Recently Added
									</button>
									<button
										className={`view-option ${currentView === 'categories' ? 'active' : ''}`}
										onClick={() => {
											setCurrentView('categories');
											setShowViewDropdown(false);
										}}
									>
										Group by Categories
									</button>
									<button
										className={`view-option ${currentView === 'repeating' ? 'active' : ''}`}
										onClick={() => {
											setCurrentView('repeating');
											setShowViewDropdown(false);
										}}
									>
										Repeating Tasks
									</button>
									<button
										className={`view-option ${currentView === 'archived' ? 'active' : ''}`}
										onClick={() => {
											setCurrentView('archived');
											setShowViewDropdown(false);
										}}
									>
										Archived tasks
									</button>
								</div>
							)}
						</div>
							</div>
						</div>
					</div>
					<div className="saved-texts">
						{sortedTasks.length === 0 && (
							<div className="empty-state">
								{currentView === 'archived' && <p>No archived tasks yet.</p>}
								{currentView === 'repeating' && <p>No repeating tasks yet.</p>}
								{currentView !== 'archived' && currentView !== 'repeating' && savedTexts.length === 0 && <p>No tasks yet. Add your first task above!</p>}
								{currentView !== 'archived' && currentView !== 'repeating' && savedTexts.length > 0 && <p>All tasks are archived. Switch to "Archived tasks" view to see them.</p>}
							</div>
						)}

						{/* Default View - Grouped by Due Date with Separators */}
						{currentView === 'dates' && sortedTasks.length > 0 && (() => {
							const groups = groupTasksByDueDate();
							const renderTaskItem = (task: typeof sortedTasks[0]) => (
								<div
									key={task.id}
									className={`task-item ${task.completed ? 'completed' : ''}`}
									onClick={() => setViewingTask(task.id)}
								>
									<div className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
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
											{task.description && (
												<div className="task-description-preview">
													<span className="description-text">{getDescriptionPreview(task.description)}</span>
												</div>
											)}
											{(task.categoryId || task.reminder) && (
												<div className="task-meta">
													{task.reminder && (
														<span className={`task-reminder ${getReminderUrgency(task.reminder)}`}>
															⏰ {formatReminderTime(task.reminder)}{formatRepeat(task.repeat)}
														</span>
													)}
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
												</div>
											)}
										</div>
									</div>
									<div className="task-actions" onClick={(e) => e.stopPropagation()}>
										<button
											className="action-btn archive-btn"
											onClick={() => task.archived ? unarchiveTask(task.id) : archiveTask(task.id)}
										>
											📥
											<span className="action-tooltip">
												{task.archived ? 'Unarchive task' : 'Archive task'}
											</span>
										</button>
									</div>
								</div>
							);

							return (
								<>
									{groups.overdue.length > 0 && (() => {
										const remaining = groups.overdue.filter(t => !t.completed).length;
										const total = groups.overdue.length;
										return (
											<div className="task-group-section">
												<div className="task-group-separator">
													<span className="separator-text">🔴 OVERDUE TASKS</span>
													<span className="separator-count">
														(<span className="count-remaining overdue">{remaining}</span> / {total})
													</span>
												</div>
												{groups.overdue.map(renderTaskItem)}
											</div>
										);
									})()}
									{groups.today.length > 0 && (() => {
										const remaining = groups.today.filter(t => !t.completed).length;
										const total = groups.today.length;
										return (
											<div className="task-group-section">
												<div className="task-group-separator">
													<span className="separator-text">🟠 TASKS DUE TODAY</span>
													<span className="separator-count">
														(<span className="count-remaining today">{remaining}</span> / {total})
													</span>
												</div>
												{groups.today.map(renderTaskItem)}
											</div>
										);
									})()}
									{groups.soon.length > 0 && (() => {
										const remaining = groups.soon.filter(t => !t.completed).length;
										const total = groups.soon.length;
										return (
											<div className="task-group-section">
												<div className="task-group-separator">
													<span className="separator-text">🔵 TASKS DUE SOON</span>
													<span className="separator-count">
														(<span className="count-remaining soon">{remaining}</span> / {total})
													</span>
												</div>
												{groups.soon.map(renderTaskItem)}
											</div>
										);
									})()}
									{groups.noDueDate.length > 0 && (() => {
										const remaining = groups.noDueDate.filter(t => !t.completed).length;
										const total = groups.noDueDate.length;
										return (
											<div className="task-group-section">
												<div className="task-group-separator">
													<span className="separator-text"><span className="grey-circle">⚫</span> TASKS WITH NO DUE DATE</span>
													<span className="separator-count">
														(<span className="count-remaining no-date">{remaining}</span> / {total})
													</span>
												</div>
												{groups.noDueDate.map(renderTaskItem)}
											</div>
										);
									})()}
								</>
							);
						})()}

						{/* Categories View - Grouped by Category with Expanders */}
						{currentView === 'categories' && sortedTasks.length > 0 && groupTasksByCategory().map((group) => {
							const category = group.categoryId ? getCategoryById(group.categoryId) : null;
							const isExpanded = expandedCategories.has(group.categoryId || 'no-category');

							return (
								<div key={group.categoryId || 'no-category'} className="category-group">
									<div
										className="category-group-header"
										onClick={() => toggleCategoryExpansion(group.categoryId || 'no-category')}
									>
										<div className="category-group-info">
											{category ? (
												<span className="category-group-chip" style={{ backgroundColor: category.color }}>
													#{category.name.toLowerCase()}
												</span>
											) : (
												<span className="category-group-chip no-category">
													No category
												</span>
											)}
											<span className="category-group-count">{group.tasks.length}</span>
										</div>
										<span className="category-group-chevron">{isExpanded ? '▼' : '▶'}</span>
									</div>

									{isExpanded && (
										<div className="category-group-tasks">
											{group.tasks.map((task) => (
												<div
													key={task.id}
													className={`task-item ${task.completed ? 'completed' : ''}`}
													onClick={() => setViewingTask(task.id)}
												>
													<div className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
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
															{task.description && (
																<div className="task-description-preview">
																	<span className="description-text">{getDescriptionPreview(task.description)}</span>
																</div>
															)}
															{task.reminder && (
																<div className="task-meta">
																	<span className={`task-reminder ${getReminderUrgency(task.reminder)}`}>
																		⏰ {formatReminderTime(task.reminder)}{formatRepeat(task.repeat)}
																	</span>
																</div>
															)}
														</div>
													</div>
													<div className="task-actions" onClick={(e) => e.stopPropagation()}>
														<button
															className="action-btn archive-btn"
															onClick={() => task.archived ? unarchiveTask(task.id) : archiveTask(task.id)}
														>
															📥
															<span className="action-tooltip">
																{task.archived ? 'Unarchive task' : 'Archive task'}
															</span>
														</button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}

						{/* Other Views - Flat List */}
						{currentView !== 'categories' && currentView !== 'dates' && sortedTasks.map((task) => (
							<div
								key={task.id}
								className={`task-item ${task.completed ? 'completed' : ''}`}
								onClick={() => setViewingTask(task.id)}
							>
								<div className="checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
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
										{/* Line 1: Title */}
										<p className="task-text">
											{task.text}
										</p>

										{/* Line 2: Description preview (if exists) */}
										{task.description && (
											<div className="task-description-preview">
												<span className="description-text">{getDescriptionPreview(task.description)}</span>
											</div>
										)}

										{/* Line 3: Reminder and Category */}
										{(task.categoryId || task.reminder) && (
											<div className="task-meta">
												{task.reminder && (
													<span className={`task-reminder ${getReminderUrgency(task.reminder)}`}>
														⏰ {formatReminderTime(task.reminder)}{formatRepeat(task.repeat)}
													</span>
												)}
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
											</div>
										)}
									</div>
								</div>
								<div className="task-actions" onClick={(e) => e.stopPropagation()}>
									<button
										className="action-btn archive-btn"
										onClick={() => task.archived ? unarchiveTask(task.id) : archiveTask(task.id)}
									>
										📥
										<span className="action-tooltip">
											{task.archived ? 'Unarchive task' : 'Archive task'}
										</span>
									</button>
								</div>
							</div>
						))}
					</div>
			</div>

			{/* Delete Task Confirmation Dialog */}
			{deleteConfirmId && (
				<div className="modal-overlay" onClick={cancelDelete}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h3>Delete Task?</h3>
						<p>Do you want to delete this task?</p>
						<div className="modal-actions">
							<button className="modal-btn yes-btn" onClick={confirmDelete} autoFocus>
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
							<button className="modal-btn yes-btn" onClick={confirmDeleteCategory} autoFocus>
								Yes
							</button>
							<button className="modal-btn no-btn" onClick={cancelDeleteCategory}>
								No
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete All Archived Tasks Confirmation Dialog */}
			{showDeleteAllArchivedConfirm && (() => {
				const archivedCount = savedTexts.filter(task => task.archived).length;
				return (
					<div className="modal-overlay delete-confirm-overlay" onClick={cancelDeleteAllArchived}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<h3>Delete All Archived Tasks?</h3>
							<p>This will permanently delete <strong>{archivedCount}</strong> archived {archivedCount === 1 ? 'task' : 'tasks'}. This action cannot be undone.</p>
							<div className="modal-actions">
								<button className="modal-btn yes-btn" onClick={confirmDeleteAllArchived} autoFocus>
									Yes
								</button>
								<button className="modal-btn no-btn" onClick={cancelDeleteAllArchived}>
									No
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Archive All Completed Tasks Confirmation Dialog */}
			{showArchiveAllCompletedConfirm && (() => {
				const completedCount = filteredTasks.filter(task => task.completed).length;
				return (
					<div className="modal-overlay delete-confirm-overlay" onClick={cancelArchiveAllCompleted}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<h3>Archive All Completed Tasks?</h3>
							<p>This will move <strong>{completedCount}</strong> completed {completedCount === 1 ? 'task' : 'tasks'} to the archived view.</p>
							<div className="modal-actions">
								<button className="modal-btn yes-btn" onClick={confirmArchiveAllCompleted} autoFocus>
									Yes
								</button>
								<button className="modal-btn no-btn" onClick={cancelArchiveAllCompleted}>
									No
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Mark All as Completed Confirmation Dialog */}
			{showMarkAllCompletedConfirm && (() => {
				const incompleteCount = filteredTasks.filter(task => !task.completed).length;
				return (
					<div className="modal-overlay delete-confirm-overlay" onClick={cancelMarkAllCompleted}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<h3>Mark All Tasks as Completed?</h3>
							<p>This will mark <strong>{incompleteCount}</strong> incomplete {incompleteCount === 1 ? 'task' : 'tasks'} in the current view as completed.</p>
							<div className="modal-actions">
								<button className="modal-btn yes-btn" onClick={confirmMarkAllCompleted} autoFocus>
									Yes
								</button>
								<button className="modal-btn no-btn" onClick={cancelMarkAllCompleted}>
									No
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Mark All as Incomplete Confirmation Dialog */}
			{showMarkAllNotCompletedConfirm && (() => {
				const completedCount = filteredTasks.filter(task => task.completed).length;
				return (
					<div className="modal-overlay delete-confirm-overlay" onClick={cancelMarkAllNotCompleted}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<h3>Mark All Tasks as Incomplete?</h3>
							<p>This will mark <strong>{completedCount}</strong> completed {completedCount === 1 ? 'task' : 'tasks'} in the current view as incomplete.</p>
							<div className="modal-actions">
								<button className="modal-btn yes-btn" onClick={confirmMarkAllNotCompleted} autoFocus>
									Yes
								</button>
								<button className="modal-btn no-btn" onClick={cancelMarkAllNotCompleted}>
									No
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Unarchive All Tasks Confirmation Dialog */}
			{showUnarchiveAllConfirm && (() => {
				const archivedCount = savedTexts.filter(task => task.archived).length;
				return (
					<div className="modal-overlay delete-confirm-overlay" onClick={cancelUnarchiveAll}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<h3>Unarchive All Tasks?</h3>
							<p>This will restore <strong>{archivedCount}</strong> archived {archivedCount === 1 ? 'task' : 'tasks'} to your active task list.</p>
							<div className="modal-actions">
								<button className="modal-btn yes-btn" onClick={confirmUnarchiveAll} autoFocus>
									Yes
								</button>
								<button className="modal-btn no-btn" onClick={cancelUnarchiveAll}>
									No
								</button>
							</div>
						</div>
					</div>
				);
			})()}

			{/* View Task Details Modal */}
			{viewingTask && (() => {
				const task = savedTexts.find(t => t.id === viewingTask);
				if (!task) return null;
				const category = getCategoryById(editingTaskCategory);

				const handleSaveAndClose = () => {
					// Save changes
					updateText(
						task.id,
						editingTaskTitle,
						editingTaskReminder,
						editingTaskCategory,
						editingTaskReminder ? editingTaskRepeat : undefined,
						editingTaskDescription || undefined
					);
					setViewingTask(null);
					setShowReminderPickerInPopup(false);
					setShowCategoryPickerInPopup(false);
				};

				const handleCancelAndClose = () => {
					// Don't save changes, just close
					setViewingTask(null);
					setShowReminderPickerInPopup(false);
					setShowCategoryPickerInPopup(false);
				};

				return (
					<div className="modal-overlay" onClick={handleCancelAndClose}>
						<div
							className="task-details-modal"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && e.ctrlKey) {
									e.preventDefault();
									handleSaveAndClose();
								}
							}}
						>
							{/* Close button row */}
							<div className="modal-close-row">
								<button className="close-popup" onClick={handleCancelAndClose}>✕</button>
							</div>

							{/* Task Title with Checkbox */}
							<div className="task-details-header">
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
								<textarea
									className={`task-details-title-input ${task.completed ? 'completed' : ''}`}
									value={editingTaskTitle}
									onChange={(e) => setEditingTaskTitle(e.target.value)}
									placeholder="What's your next task?"
									maxLength={250}
									rows={1}
									onInput={(e) => {
										// Auto-expand textarea with max 3 lines
										const target = e.target as HTMLTextAreaElement;
										target.style.height = 'auto';
										const lineHeight = 24; // approximate line height in pixels
										const maxHeight = lineHeight * 3;
										const newHeight = Math.min(target.scrollHeight, maxHeight);
										target.style.height = newHeight + 'px';
										target.style.overflowY = target.scrollHeight > maxHeight ? 'auto' : 'hidden';
									}}
								/>
							</div>

							{/* Description/Details - Editable */}
							<div className="task-details-description">
								<RichTextEditor
									value={editingTaskDescription}
									onChange={setEditingTaskDescription}
									autoFocus={false}
								/>
							</div>

							{/* Metadata - Editable */}
							<div className="task-details-meta-editable">
								{/* Reminder */}
								{editingTaskReminder ? (
									<div
										className="selected-reminder clickable-chip"
										onClick={() => {
											const isOpening = !showReminderPickerInPopup;
											setShowReminderPickerInPopup(isOpening);
											setShowCategoryPickerInPopup(false);

											// Auto-expand advanced settings if opening and has custom time or recurrence
											if (isOpening && editingTaskReminder) {
												const reminderDate = new Date(editingTaskReminder);
												const hasCustomTime = !(reminderDate.getHours() === 9 && reminderDate.getMinutes() === 0 && reminderDate.getSeconds() === 1);
												const hasRecurrence = editingTaskRepeat && editingTaskRepeat !== 'none';

												if (hasCustomTime || hasRecurrence) {
													setShowAdvancedReminder(true);
												}
											}
										}}
									>
										<span>⏰ {formatReminderTime(editingTaskReminder)}{formatRepeat(editingTaskRepeat)}</span>
										<button
											className="meta-remove"
											onClick={(e) => {
												e.stopPropagation();
												setEditingTaskReminder(undefined);
												setEditingTaskRepeat('none');
											}}
										>
											✕
										</button>
									</div>
								) : (
									<button
										className="meta-icon-btn"
										onClick={() => {
											setShowReminderPickerInPopup(!showReminderPickerInPopup);
											setShowCategoryPickerInPopup(false);
										}}
									>
										🔔
										<span className="meta-tooltip">Set reminder</span>
									</button>
								)}

								{/* Category */}
								{editingTaskCategory ? (() => {
									const cat = getCategoryById(editingTaskCategory);
									return cat ? (
										<div
											className="selected-category clickable-chip"
											style={{ backgroundColor: cat.color }}
											onClick={() => {
												setShowCategoryPickerInPopup(!showCategoryPickerInPopup);
												setShowReminderPickerInPopup(false);
											}}
										>
											<span>#{cat.name.toLowerCase()}</span>
											<button
												className="meta-remove"
												onClick={(e) => {
													e.stopPropagation();
													setEditingTaskCategory(undefined);
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
											setShowCategoryPickerInPopup(!showCategoryPickerInPopup);
											setShowReminderPickerInPopup(false);
										}}
									>
										🏷️
										<span className="meta-tooltip">Set category</span>
									</button>
								)}

								{/* Reminder Picker in Popup */}
								{showReminderPickerInPopup && (
									<div
										className="reminder-popup popup-inline"
										onClick={(e) => e.stopPropagation()}
									>
										<div className="reminder-header">
											<h3>Reminder</h3>
											<button className="close-popup" onClick={() => { setShowReminderPickerInPopup(false); setShowAdvancedReminder(false); }}>✕</button>
										</div>

										<div className="quick-reminders">
											<button onClick={() => {
												const now = new Date();
												const reminderDate = new Date(now);
												reminderDate.setHours(17, 0, 0, 0);
												setEditingTaskReminder(reminderDate.toISOString());
												setShowReminderPickerInPopup(false);
											}}>
												<span className="quick-time">Later Today</span>
												<span className="quick-subtext">17:00</span>
											</button>
											<button onClick={() => {
												const now = new Date();
												const reminderDate = new Date(now);
												reminderDate.setDate(now.getDate() + 1);
												reminderDate.setHours(9, 0, 0, 0);
												setEditingTaskReminder(reminderDate.toISOString());
												setShowReminderPickerInPopup(false);
											}}>
												<span className="quick-time">Tomorrow Morning</span>
												<span className="quick-subtext">09:00</span>
											</button>
											<button onClick={() => {
												const now = new Date();
												const reminderDate = new Date(now);
												const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
												reminderDate.setDate(now.getDate() + daysUntilSaturday);
												reminderDate.setHours(10, 0, 0, 0);
												setEditingTaskReminder(reminderDate.toISOString());
												setShowReminderPickerInPopup(false);
											}}>
												<span className="quick-time">This Weekend</span>
												<span className="quick-subtext">Saturday 10:00</span>
											</button>
										</div>

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
																		if (option.value === '') return false;
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
																		if (option.value === '') return false;
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
															value={REPEAT_OPTIONS.find(opt => opt.value === editingTaskRepeat)}
															onChange={(option) => option && setEditingTaskRepeat(option.value as RepeatOption)}
															options={REPEAT_OPTIONS}
															className="repeat-select-container"
															classNamePrefix="repeat-select"
															isSearchable={false}
															menuPlacement="auto"
														/>
													</div>

													<button
														className="set-button"
														onClick={() => {
															if (customDate) {
																const dateStr = customDate.toISOString().split('T')[0];
																let reminderDate: Date;

																if (customTime) {
																	reminderDate = new Date(`${dateStr}T${customTime}:00`);
																} else {
																	reminderDate = new Date(`${dateStr}T09:00:01`);
																}

																setEditingTaskReminder(reminderDate.toISOString());
																setShowReminderPickerInPopup(false);
																setShowAdvancedReminder(false);
															}
														}}
														disabled={!customDate}
													>
														SET
													</button>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Category Picker in Popup */}
								{showCategoryPickerInPopup && (
									<div
										className="category-popup popup-inline"
										onClick={(e) => e.stopPropagation()}
									>
										<div className="category-header">
											<h3>Choose Category</h3>
											<button className="close-popup" onClick={() => setShowCategoryPickerInPopup(false)}>✕</button>
										</div>
										<div className="category-list">
											{categories.map((cat) => (
												<button
													key={cat.id}
													className="category-option"
													style={{ borderLeftColor: cat.color, backgroundColor: cat.color }}
													onClick={() => {
														setEditingTaskCategory(cat.id);
														setShowCategoryPickerInPopup(false);
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
												setShowCategoryPickerInPopup(false);
											}}
										>
											⚙️ Manage Categories
										</button>
									</div>
								)}
							</div>

							{/* Actions */}
							<div className="task-details-actions">
								<div className="task-actions-left">
									<button
										className="task-icon-action-btn archive-icon-action"
										onClick={() => {
											task.archived ? unarchiveTask(task.id) : archiveTask(task.id);
											setViewingTask(null);
										}}
									>
										📥
										<span className="action-tooltip">
											{task.archived ? 'Unarchive Task' : 'Archive Task'}
										</span>
									</button>
									<button
										className="task-icon-action-btn delete-icon-action"
										onClick={() => {
											handleDelete(task.id);
											setViewingTask(null);
										}}
									>
										🗑️
										<span className="action-tooltip">Delete Task</span>
									</button>
								</div>
								<div className="task-actions-right">
									<button
										className="modal-btn cancel-btn"
										onClick={handleCancelAndClose}
									>
										Cancel
									</button>
									<button
										className="modal-btn done-btn"
										onClick={handleSaveAndClose}
									>
										Done
									</button>
								</div>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Add Task Details Modal */}
			{showDescriptionModal && (
				<div className="modal-overlay" onClick={() => setShowDescriptionModal(false)}>
					<div
						className="task-details-input-modal"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && e.ctrlKey) {
								e.preventDefault();
								// If editing an existing task, update editingTaskDescription
								if (viewingTask) {
									setEditingTaskDescription(tempDescription);
								} else {
									// If adding a new task, update description
									setDescription(tempDescription);
								}
								setShowDescriptionModal(false);
							}
						}}
					>
						<div className="modal-header">
							<h3>Task Details</h3>
							<button className="close-popup" onClick={() => setShowDescriptionModal(false)}>✕</button>
						</div>
						<div className="modal-content-editor">
							<RichTextEditor
								value={tempDescription}
								onChange={setTempDescription}
								placeholder=""
								autoFocus={true}
							/>
						</div>
						<div className="modal-actions-row">
							<button
								className="modal-btn cancel-btn"
								onClick={() => {
									// Restore original value
									if (viewingTask) {
										setTempDescription(editingTaskDescription);
									} else {
										setTempDescription(description);
									}
									setShowDescriptionModal(false);
								}}
							>
								Cancel
							</button>
							<button
								className="modal-btn apply-btn"
								onClick={() => {
									// If editing an existing task, update editingTaskDescription
									if (viewingTask) {
										setEditingTaskDescription(tempDescription);
									} else {
										// If adding a new task, update description
										setDescription(tempDescription);
									}
									setShowDescriptionModal(false);
								}}
							>
								Done
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
							{categories.map((cat, index) => (
								<div
									key={cat.id}
									className={`category-item ${draggedCategoryIndex === index ? 'dragging' : ''}`}
									draggable
									onDragStart={(e) => handleDragStart(e, index)}
									onDragOver={handleDragOver}
									onDrop={(e) => handleDrop(e, index)}
									onDragEnd={handleDragEnd}
								>
									<div className="category-item-info">
										<span className="drag-handle">⋮⋮</span>
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
