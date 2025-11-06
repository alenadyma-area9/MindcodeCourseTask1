import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';

export interface CategoryItem {
	id: string;
	name: string;
	color: string;
}

export interface Task {
	id: string;
	text: string;
	description?: string; // Rich text description/notes
	completed: boolean;
	archived?: boolean; // Whether task is archived
	createdAt?: number; // Timestamp when task was created
	completedAt?: number; // Timestamp when task was completed
	reminder?: string;
	repeat?: RepeatOption;
	categoryId?: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
	{ id: '1', name: 'Home', color: '#D8E8C9' },
	{ id: '2', name: 'Work', color: '#BDE0FF' },
	{ id: '3', name: 'Errands', color: '#FFD8A8' },
	{ id: '4', name: 'Personal', color: '#FAD2E1' },
	{ id: '5', name: 'Health', color: '#C8F5E1' },
	{ id: '6', name: 'Finance', color: '#FFF8C5' },
];

interface TextState {
	savedTexts: Task[];
	categories: CategoryItem[];
	addText: (newText: string, reminder?: string, categoryId?: string, repeat?: RepeatOption, description?: string) => void;
	deleteText: (id: string) => void;
	toggleComplete: (id: string) => void;
	archiveTask: (id: string) => void;
	unarchiveTask: (id: string) => void;
	updateText: (id: string, newText: string, reminder?: string, categoryId?: string, repeat?: RepeatOption, description?: string) => void;
	addCategory: (name: string, color: string) => void;
	updateCategory: (id: string, name: string, color: string) => void;
	deleteCategory: (id: string) => void;
	reorderCategories: (startIndex: number, endIndex: number) => void;
}

const useTextStore = create<TextState>()(
	persist(
		(set) => ({
			savedTexts: [],
			categories: DEFAULT_CATEGORIES,
			addText: (newText, reminder, categoryId, repeat, description) =>
				set((state) => ({
					savedTexts: [...state.savedTexts, { id: uuidv4(), text: newText, completed: false, createdAt: Date.now(), reminder, categoryId, repeat, description }],
				})),
			deleteText: (id) =>
				set((state) => ({
					savedTexts: state.savedTexts.filter((task) => task.id !== id),
				})),
			toggleComplete: (id) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id
							? { ...task, completed: !task.completed, completedAt: !task.completed ? Date.now() : undefined }
							: task
					),
				})),
			archiveTask: (id) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id ? { ...task, archived: true } : task
					),
				})),
			unarchiveTask: (id) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id ? { ...task, archived: false } : task
					),
				})),
			updateText: (id, newText, reminder, categoryId, repeat, description) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id ? { ...task, text: newText, reminder, categoryId, repeat, description } : task
					),
				})),
			addCategory: (name, color) =>
				set((state) => ({
					categories: [...state.categories, { id: uuidv4(), name, color }],
				})),
			updateCategory: (id, name, color) =>
				set((state) => ({
					categories: state.categories.map((cat) =>
						cat.id === id ? { ...cat, name, color } : cat
					),
				})),
			deleteCategory: (id) =>
				set((state) => ({
					categories: state.categories.filter((cat) => cat.id !== id),
					// Remove category from tasks
					savedTexts: state.savedTexts.map((task) =>
						task.categoryId === id ? { ...task, categoryId: undefined } : task
					),
				})),
			reorderCategories: (startIndex, endIndex) =>
				set((state) => {
					const newCategories = Array.from(state.categories);
					const [removed] = newCategories.splice(startIndex, 1);
					newCategories.splice(endIndex, 0, removed);
					return { categories: newCategories };
				}),
		}),
		{
			name: 'text-storage',
			version: 2,
			migrate: (persistedState: any, version: number) => {
				// Migrate old string[] format to new Task[] format
				if (version === 0 && Array.isArray(persistedState?.savedTexts)) {
					return {
						...persistedState,
						savedTexts: persistedState.savedTexts.map((text: string | Task) => {
							// If it's already a Task object, keep it
							if (typeof text === 'object' && 'id' in text) {
								return text;
							}
							// If it's a string, convert it to Task
							return {
								id: uuidv4(),
								text: text as string,
								completed: false,
							};
						}),
					};
				}

				// Update category colors to new palette
				if (version < 2 && persistedState?.categories) {
					const colorMap: { [key: string]: string } = {
						'Home': '#D8E8C9',
						'Work': '#BDE0FF',
						'Errands': '#FFD8A8',
						'Personal': '#FAD2E1',
						'Health': '#C8F5E1',
						'Finance': '#FFF8C5',
					};

					return {
						...persistedState,
						categories: persistedState.categories.map((cat: CategoryItem) => ({
							...cat,
							color: colorMap[cat.name] || cat.color,
						})),
					};
				}

				return persistedState;
			},
		}
	)
);

export default useTextStore;
