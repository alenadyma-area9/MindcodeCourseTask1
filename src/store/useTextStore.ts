import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TextState {
	savedTexts: string[];
	addText: (newText: string) => void;
}

const useTextStore = create<TextState>()(
	persist(
		(set) => ({
			savedTexts: [],
			addText: (newText) =>
				set((state) => ({
					savedTexts: [...state.savedTexts, newText],
				})),
		}),
		{
			name: 'text-storage', // A unique name for the storage in Local Storage
		}
	)
);

export default useTextStore;
