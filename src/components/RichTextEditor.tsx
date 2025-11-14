import { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	autoFocus?: boolean;
	maxLength?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, autoFocus, maxLength }: RichTextEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isFocused, setIsFocused] = useState(false);

	// Auto-resize textarea based on content
	const autoResize = () => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = 'auto';
			const scrollHeight = textarea.scrollHeight;

			if (isFocused) {
				// When focused, cap at max-height and let it scroll
				const maxHeight = window.innerWidth <= 480 ? 300 : 400;
				textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
			} else {
				// When not focused, expand to fit all content
				textarea.style.height = scrollHeight + 'px';
			}
		}
	};

	// Auto-resize on mount and when value changes (but not when focused)
	useEffect(() => {
		autoResize();
	}, [value, isFocused]);

	// Auto-focus on mount if autoFocus is true
	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [autoFocus]);

	// Handle paste to preserve formatting
	const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		// Try to get HTML content from clipboard
		const html = e.clipboardData.getData('text/html');

		if (html) {
			e.preventDefault();

			// Convert HTML to markdown-style formatting
			let markdownText = html;

			// Convert links: <a href="url">text</a> -> [text](url)
			markdownText = markdownText.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, '[$2]($1)');

			// Convert bold: <strong>, <b> -> **text**
			markdownText = markdownText.replace(/<(strong|b)>([^<]+)<\/(strong|b)>/gi, '**$2**');

			// Convert italic: <em>, <i> -> _text_
			markdownText = markdownText.replace(/<(em|i)>([^<]+)<\/(em|i)>/gi, '_$2_');

			// Convert list items: <li> -> - or •
			markdownText = markdownText.replace(/<li[^>]*>([^<]+)<\/li>/gi, '• $1\n');

			// Remove remaining HTML tags
			markdownText = markdownText.replace(/<[^>]+>/g, '');

			// Decode HTML entities
			const textarea = document.createElement('textarea');
			textarea.innerHTML = markdownText;
			markdownText = textarea.value;

			// Clean up excessive whitespace and newlines
			markdownText = markdownText.replace(/^\s+/, ''); // Remove leading whitespace
			markdownText = markdownText.replace(/\s+$/, ''); // Remove trailing whitespace
			markdownText = markdownText.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

			// Insert at cursor position
			const start = textareaRef.current?.selectionStart || 0;
			const end = textareaRef.current?.selectionEnd || 0;
			const newText = value.substring(0, start) + markdownText + value.substring(end);

			onChange(newText);

			// Restore cursor position
			setTimeout(() => {
				if (textareaRef.current) {
					const newPos = start + markdownText.length;
					textareaRef.current.setSelectionRange(newPos, newPos);
					textareaRef.current.focus();
				}
			}, 0);
		}
	};

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
		<div className={`rich-text-editor ${isFocused ? 'editor-focused' : ''}`}>
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
				onInput={autoResize}
				onPaste={handlePaste}
				onFocus={() => setIsFocused(true)}
				onBlur={() => {
					setIsFocused(false);
					// Reset height after blur so it can expand naturally
					setTimeout(() => autoResize(), 0);
				}}
				placeholder={placeholder}
				maxLength={maxLength}
			/>
		</div>
	);
}

// Helper function to convert markdown-style formatting to HTML for display
export function formatTextToHtml(text: string): string {
	if (!text) return '';

	let html = text;
	const linkPlaceholders: { [key: string]: string } = {};
	let placeholderIndex = 0;

	// Step 1: Handle malformed markdown links: [text]url or [text]url) -> [text](url)
	html = html.replace(/\[([^\]]+)\](https?:\/\/[^\s\)]+)\)?/gi, '[$1]($2)');

	// Step 2: Convert markdown links to HTML and store with placeholders
	html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
		const placeholder = `###LINKPLACEHOLDER${placeholderIndex}###`;
		linkPlaceholders[placeholder] = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
		placeholderIndex++;
		return placeholder;
	});

	// Step 3: Auto-detect bare URLs and store with placeholders
	const urlRegex = /(?:^|[^"'>=\]])((https?:\/\/|www\.)[^\s<\]]+[^\s<.,;:!?'")\]])/gi;
	html = html.replace(urlRegex, (match, url, protocol) => {
		const fullUrl = protocol === 'www.' ? 'https://' + url : url;
		const prefix = match.charAt(0).match(/[a-z0-9]/i) ? '' : match.charAt(0);
		const placeholder = `###LINKPLACEHOLDER${placeholderIndex}###`;
		linkPlaceholders[placeholder] = `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
		placeholderIndex++;
		return prefix + placeholder;
	});

	// Step 4: Now process bold/italic (URLs are protected by placeholders)
	// Bold: **text** -> <strong>text</strong>
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

	// Italic: _text_ -> <em>text</em>
	html = html.replace(/_(.+?)_/g, '<em>$1</em>');

	// Step 5: Process lists
	// Bullet points with dash: - text -> <li>text</li>
	html = html.replace(/^- (.+)$/gm, '<li class="bullet">$1</li>');

	// Bullet points with bullet symbol: • text -> <li>text</li>
	html = html.replace(/^• (.+)$/gm, '<li class="bullet">$1</li>');

	// Numbered lists: 1. text, 2. text -> <li>text</li>
	html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>');

	// Wrap consecutive bullet <li> in <ul>
	html = html.replace(/(<li class="bullet">.*?<\/li>(<br>)?)+/g, '<ul>$&</ul>');

	// Wrap consecutive numbered <li> in <ol>
	html = html.replace(/(<li class="numbered">.*?<\/li>(<br>)?)+/g, '<ol>$&</ol>');

	// Clean up the class attributes (not needed in final HTML)
	html = html.replace(/<li class="(bullet|numbered)">/g, '<li>');

	// Step 6: Line breaks (do this before restoring links)
	html = html.replace(/\n/g, '<br>');

	// Step 7: Restore link placeholders
	for (const placeholder in linkPlaceholders) {
		// Use split/join for reliable replacement
		html = html.split(placeholder).join(linkPlaceholders[placeholder]);
	}

	return html;
}
