import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';

export interface CategoryItem {
	id: string;
	name: string;
	color: string;
	icon: string;
}

export interface Task {
	id: string;
	text: string;
	completed: boolean;
	reminder?: string;
	repeat?: RepeatOption;
	categoryId?: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
	{ id: '1', name: 'Home', color: '#66D9AD', icon: '🏠' },
	{ id: '2', name: 'Work', color: '#6A5ACD', icon: '💼' },
	{ id: '3', name: 'Errands', color: '#FF9800', icon: '🛒' },
	{ id: '4', name: 'Personal', color: '#9C27B0', icon: '👤' },
	{ id: '5', name: 'Health', color: '#F44336', icon: '❤️' },
	{ id: '6', name: 'Finance', color: '#3CB371', icon: '💰' },
];

interface TextState {
	savedTexts: Task[];
	categories: CategoryItem[];
	addText: (newText: string, reminder?: string, categoryId?: string, repeat?: RepeatOption) => void;
	deleteText: (id: string) => void;
	toggleComplete: (id: string) => void;
	updateText: (id: string, newText: string, reminder?: string, categoryId?: string, repeat?: RepeatOption) => void;
	addCategory: (name: string, color: string, icon: string) => void;
	updateCategory: (id: string, name: string, color: string, icon: string) => void;
	deleteCategory: (id: string) => void;
}

const useTextStore = create<TextState>()(
	persist(
		(set) => ({
			savedTexts: [],
			categories: DEFAULT_CATEGORIES,
			addText: (newText, reminder, categoryId, repeat) =>
				set((state) => ({
					savedTexts: [...state.savedTexts, { id: uuidv4(), text: newText, completed: false, reminder, categoryId, repeat }],
				})),
			deleteText: (id) =>
				set((state) => ({
					savedTexts: state.savedTexts.filter((task) => task.id !== id),
				})),
			toggleComplete: (id) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id ? { ...task, completed: !task.completed } : task
					),
				})),
			updateText: (id, newText, reminder, categoryId, repeat) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id ? { ...task, text: newText, reminder, categoryId, repeat } : task
					),
				})),
			addCategory: (name, color, icon) =>
				set((state) => ({
					categories: [...state.categories, { id: uuidv4(), name, color, icon }],
				})),
			updateCategory: (id, name, color, icon) =>
				set((state) => ({
					categories: state.categories.map((cat) =>
						cat.id === id ? { ...cat, name, color, icon } : cat
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
		}),
		{
			name: 'text-storage',
			version: 1,
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
				return persistedState;
			},
		}
	)
);

export default useTextStore;
