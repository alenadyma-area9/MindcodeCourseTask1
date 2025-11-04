import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Category = 'Home' | 'Work' | 'Errands' | 'Personal' | 'Health' | 'Finance';

export interface Task {
	id: string;
	text: string;
	completed: boolean;
	reminder?: string;
	category?: Category;
}

interface TextState {
	savedTexts: Task[];
	addText: (newText: string, reminder?: string, category?: Category) => void;
	deleteText: (id: string) => void;
	toggleComplete: (id: string) => void;
	updateText: (id: string, newText: string, reminder?: string, category?: Category) => void;
}

const useTextStore = create<TextState>()(
	persist(
		(set) => ({
			savedTexts: [],
			addText: (newText, reminder, category) =>
				set((state) => ({
					savedTexts: [...state.savedTexts, { id: uuidv4(), text: newText, completed: false, reminder, category }],
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
			updateText: (id, newText, reminder, category) =>
				set((state) => ({
					savedTexts: state.savedTexts.map((task) =>
						task.id === id ? { ...task, text: newText, reminder, category } : task
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
