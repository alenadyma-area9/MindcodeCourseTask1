import { useState, useRef } from 'react';

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const insertFormatting = (before: string, after: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = value.substring(start, end);
		const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

		onChange(newText);

		// Restore cursor position after update
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + before.length, end + before.length);
		}, 0);
	};

	const handleBold = () => insertFormatting('**', '**');
	const handleItalic = () => insertFormatting('_', '_');
	const handleBulletList = () => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const newText = value.substring(0, lineStart) + '• ' + value.substring(lineStart);

		onChange(newText);
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + 2, start + 2);
		}, 0);
	};

	const handleNumberedList = () => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const newText = value.substring(0, lineStart) + '1. ' + value.substring(lineStart);

		onChange(newText);
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + 3, start + 3);
		}, 0);
	};

	const handleLink = () => {
		const url = prompt('Enter URL:');
		if (url) {
			insertFormatting('[', `](${url})`);
		}
	};

	const handleEmoji = () => {
		const emojis = ['😊', '👍', '❤️', '🎉', '✅', '⭐', '🔥', '💡', '📌', '🎯'];
		const emoji = emojis[Math.floor(Math.random() * emojis.length)];
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const newText = value.substring(0, start) + emoji + value.substring(start);

		onChange(newText);
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + emoji.length, start + emoji.length);
		}, 0);
	};

	return (
		<div className="rich-text-editor">
			<div className="editor-toolbar">
				<button type="button" className="toolbar-btn" onClick={handleBold} title="Bold">
					<strong>B</strong>
				</button>
				<button type="button" className="toolbar-btn" onClick={handleItalic} title="Italic">
					<em>I</em>
				</button>
				<div className="toolbar-divider"></div>
				<button type="button" className="toolbar-btn" onClick={handleBulletList} title="Bullet List">
					•
				</button>
				<button type="button" className="toolbar-btn" onClick={handleNumberedList} title="Numbered List">
					1.
				</button>
				<div className="toolbar-divider"></div>
				<button type="button" className="toolbar-btn" onClick={handleLink} title="Insert Link">
					🔗
				</button>
				<button type="button" className="toolbar-btn" onClick={handleEmoji} title="Add Emoji">
					😊
				</button>
			</div>
			<textarea
				ref={textareaRef}
				className="editor-textarea"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
			/>
		</div>
	);
}

// Helper function to convert markdown-style formatting to HTML for display
export function formatTextToHtml(text: string): string {
	if (!text) return '';

	let html = text;

	// Bold: **text** -> <strong>text</strong>
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

	// Italic: _text_ -> <em>text</em>
	html = html.replace(/_(.+?)_/g, '<em>$1</em>');

	// Links: [text](url) -> <a href="url">text</a>
	html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

	// Bullet points: • text -> <li>text</li>
	html = html.replace(/^• (.+)$/gm, '<li>$1</li>');

	// Numbered lists: 1. text -> <li>text</li>
	html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

	// Wrap consecutive <li> in <ul>
	html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');

	// Line breaks
	html = html.replace(/\n/g, '<br>');

	return html;
}
