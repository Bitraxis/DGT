// Randomize blob grid positions on each page load (keep first child centered)
(function () {
	// cookie helpers to persist blob texts
	function readJsonCookie(name) {
		const m = document.cookie.match('(?:^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)');
		if (!m) return null;
		try {
			return JSON.parse(decodeURIComponent(m[1]));
		} catch (e) {
			return null;
		}
	}

	function writeJsonCookie(name, obj, days = 365) {
		const v = encodeURIComponent(JSON.stringify(obj));
		const d = new Date();
		d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
		document.cookie = `${name}=${v}; expires=${d.toUTCString()}; path=/`;
	}

	const COOKIE_NAME = 'ideon_blob_texts_v1';
	const SEED_COOKIE = 'ideon_blob_seed_v1';

	// playful hover messages to show on blob hover
	const HOVER_MESSAGES = [
		"yaay!",
		"hiya! ^w^",
		"this is so secwet uwu",
		"i like ideon!",
		"keep the ideas flowing",
		"so much thoughts!",
		"lately I've been thinking about boys. >w<",
		"also play minecraft",
		"do you like organizing thoughts?",
		"am i weird? pls say no...",
		"made by Bitraxis and some slight AI (don't kill me pls)"
	];

	// seeded RNG helpers (xmur3 + mulberry32)
	function xmur3(str) {
		for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
			h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
			h = (h << 13) | (h >>> 19);
		}
		return function() {
			h = Math.imul(h ^ (h >>> 16), 2246822507);
			h = Math.imul(h ^ (h >>> 13), 3266489909);
			return (h ^= h >>> 16) >>> 0;
		};
	}

	function mulberry32(a) {
		return function() {
			var t = (a += 0x6D2B79F5);
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	// seed state (will be set on DOMContentLoaded)
	let SEED = null;
	let seededRandom = Math.random;
	// store original blob h1 texts so Reset Names can restore them
	let ORIGINAL_TEXTS = {};

	// apply saved texts from cookie to blobs (by id)
	function applySavedTexts() {
		const saved = readJsonCookie(COOKIE_NAME) || {};
		const container = document.querySelector('.interface');
		if (!container) return;
		const blobs = Array.from(container.querySelectorAll(':scope > div'));
		blobs.forEach(b => {
			if (!b.id) return;
			// Do not overwrite the Settings blob here; seed is the source of truth for that
			if (b.id === 'interface__settings') return;
			if (saved[b.id]) {
				const h = b.querySelector('h1');
				if (h) h.textContent = saved[b.id];
			}
		});
	}

	// Fisher-Yates shuffle with pluggable RNG (returns mutated array)
	function shuffle(array, rnd = Math.random) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(rnd() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

		function assignRandomPositions() {
		const container = document.querySelector('.interface');
		if (!container) return;
		const blobs = Array.from(container.querySelectorAll(':scope > div'));
		if (blobs.length === 0) return;

		// Keep the first blob centered (IDEON)
		const centerIndex = 0;

		// possible grid cells in a 3x3 (col,row) excluding center (2,2)
		const positions = [
			{ c: 1, r: 1 }, { c: 2, r: 1 }, { c: 3, r: 1 },
			{ c: 1, r: 2 }, /* center excluded */ { c: 3, r: 2 },
			{ c: 1, r: 3 }, { c: 2, r: 3 }, { c: 3, r: 3 }
		];

	// shuffle available positions with seeded RNG and assign to outer blobs
	const shuffled = shuffle(positions.slice(), seededRandom);

		// If we have more blobs than positions, reuse shuffled order cyclically
		let posIndex = 0;
		for (let i = 0; i < blobs.length; i++) {
			const el = blobs[i];
			if (i === centerIndex) {
				// ensure center stays in the middle cell
				el.style.gridColumn = '2 / 3';
				el.style.gridRow = '2 / 3';
				continue;
			}

			const p = shuffled[posIndex % shuffled.length];
			posIndex++;

			el.style.gridColumn = `${p.c} / ${p.c + 1}`;
			el.style.gridRow = `${p.r} / ${p.r + 1}`;
		}

	// after positioning, update connector vars so lines point to center correctly
	updateConnectorVars();
	// re-setup interactions because DOM positions may have changed
	setupBlobInteractions();
	}

	function updateConnectorVars() {
		const container = document.querySelector('.interface');
		if (!container) return;
		const blobs = Array.from(container.querySelectorAll(':scope > div'));
		if (blobs.length === 0) return;

		const center = blobs[0];
		const centerRect = center.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();
		const cx = centerRect.left + centerRect.width / 2 - containerRect.left;
		const cy = centerRect.top + centerRect.height / 2 - containerRect.top;

		for (let i = 1; i < blobs.length; i++) {
			const b = blobs[i];
			const r = b.getBoundingClientRect();
			const bx = r.left + r.width / 2 - containerRect.left;
			const by = r.top + r.height / 2 - containerRect.top;

			const angle = Math.atan2(cy - by, cx - bx) * 180 / Math.PI; // degrees
			const dist = Math.hypot(cx - bx, cy - by);

			// set CSS vars on the element; CSS uses --angle and --connector-length if present
			b.style.setProperty('--angle', `${angle}deg`);
			b.style.setProperty('--connector-length', `${Math.round(dist)}px`);
		}
	}

		// run on load, resize, and when DOM changes inside interface
		document.addEventListener('DOMContentLoaded', function () {
				// initialize or read seed - if none exists, generate and persist it
				let seedCookie = readJsonCookie(SEED_COOKIE);
				if (!seedCookie) {
					// create a random seed string (use timestamp + random value)
					seedCookie = String(Date.now()) + '-' + Math.floor(Math.random() * 1e9);
					writeJsonCookie(SEED_COOKIE, seedCookie, 365);
				}
				SEED = String(seedCookie);
				// build RNG
				const seedInt = xmur3(SEED)();
				seededRandom = mulberry32(seedInt);

				// apply any saved texts first (Settings blob keeps the label 'Settings')
				// capture original texts so Reset Names can restore them later
				const container = document.querySelector('.interface');
				if (container) {
					Array.from(container.querySelectorAll(':scope > div')).forEach(b => {
						if (!b.id) return;
						const h = b.querySelector('h1');
						ORIGINAL_TEXTS[b.id] = h ? String(h.textContent) : '';
					});
				}
				applySavedTexts();
				assignRandomPositions();
		});

			// render a crisp SVG gear inside the Settings blob and remove blobby styling
			function renderSettingsGear() {
				const settings = document.getElementById('interface__settings');
				if (!settings) return;
				// remove any existing content (we'll keep only the SVG gear)
				Array.from(settings.children).forEach(c => c.remove());
				// create svg gear dynamically
				const svgNS = 'http://www.w3.org/2000/svg';
				const size = 120; // viewBox size
				const teeth = 12;
				const svg = document.createElementNS(svgNS, 'svg');
				svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
				svg.setAttribute('width', '84%');
				svg.setAttribute('height', '84%');
				svg.setAttribute('aria-hidden', 'true');
				const cx = size/2, cy = size/2, r = 32; // base circle radius
				// group for teeth
				const g = document.createElementNS(svgNS, 'g');
				for (let i = 0; i < teeth; i++) {
					const angle = (360 / teeth) * i;
					const tooth = document.createElementNS(svgNS, 'rect');
					const tw = 6, th = 12;
					// position rect at top center then rotate around center
					tooth.setAttribute('x', `${cx - tw/2}`);
					tooth.setAttribute('y', `${cy - r - th + 2}`);
					tooth.setAttribute('width', `${tw}`);
					tooth.setAttribute('height', `${th}`);
					tooth.setAttribute('rx', '1');
					tooth.setAttribute('fill', 'currentColor');
					tooth.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
					g.appendChild(tooth);
				}
				// outer ring circle
				const outer = document.createElementNS(svgNS, 'circle');
				outer.setAttribute('cx', cx);
				outer.setAttribute('cy', cy);
				outer.setAttribute('r', r);
				outer.setAttribute('fill', 'none');
				outer.setAttribute('stroke', 'currentColor');
				outer.setAttribute('stroke-width', '6');
				// inner circle
				const inner = document.createElementNS(svgNS, 'circle');
				inner.setAttribute('cx', cx);
				inner.setAttribute('cy', cy);
				inner.setAttribute('r', '12');
				inner.setAttribute('fill', 'currentColor');
				svg.appendChild(g);
				svg.appendChild(outer);
				svg.appendChild(inner);
				// add visually-hidden class to heading for screen readers
				// append svg only
				settings.appendChild(svg);

				// make the settings element a standalone control in the page (top-left) by moving it out of the interface
				if (settings.parentElement && settings.parentElement.classList && settings.parentElement.classList.contains('interface')) {
					document.body.appendChild(settings);
				}

				// accessibility: role/button and keyboard support
				settings.setAttribute('role', 'button');
				settings.setAttribute('aria-label', 'Settings');
				settings.tabIndex = 0;

				// avoid duplicating handlers
				if (!settings.dataset.seedAttached) {
					settings.addEventListener('click', function (ev) { ev.stopPropagation(); openSeedModal(); });
					settings.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openSeedModal(); } });
					settings.dataset.seedAttached = '1';
				}
			}

			// render gear once DOM is ready
			document.addEventListener('DOMContentLoaded', function () {
				renderSettingsGear();
			});
 
		// add click/edit behaviour for blobs
	 function setupBlobInteractions() {
		 const container = document.querySelector('.interface');
		 if (!container) return;
		 const blobs = Array.from(container.querySelectorAll(':scope > div'));
		 if (blobs.length === 0) return;

		 // skip IDEON (index 0) for navigation/edit
			// define per-blob destinations (by element id or fallback)
			const destinations = {
				interface__brainstorm: 'brainstorm.html',
				interface__notes: 'notes.html',
				interface__settings: 'settings.html',
				interface__whiteboard: 'whiteboard.html'
			};

			for (let i = 0; i < blobs.length; i++) {
			 const b = blobs[i];
			 // mark non-center blobs clickable (settings will open a modal)
			 	 // leave clickable pointer for non-center items only
			 	 if (i !== 0) b.classList.add('clickable');

				// hover behavior: show a random playful message in a body-level overlay (avoids triggering MutationObserver)
				if (!b.dataset.hoverAttached) {
					b.addEventListener('mouseenter', function (ev) {
						try {
							// don't show while editing
							if (b.getAttribute('contenteditable') === 'true') return;
							// skip settings blob (keep settings label explicit)
							if (b.id === 'interface__settings') return;
							// avoid creating multiple overlays
							if (document.body.querySelector('.hover-message[data-src="' + b.id + '"]')) return;
							const span = document.createElement('div');
							span.className = 'hover-message';
							span.setAttribute('data-src', b.id || 'blob');
							const idx = Math.floor(Math.random() * HOVER_MESSAGES.length);
							span.textContent = HOVER_MESSAGES[idx];

							function positionOverlay() {
								const rect = b.getBoundingClientRect();
								// prefer below the blob heading
								const offsetY = 10; // px gap
								let left = rect.left + rect.width / 2;
								// compute desired top below the blob
								let top = rect.bottom + offsetY;
								// ensure span has been laid out to read its size
								const sw = span.offsetWidth || 0;
								const sh = span.offsetHeight || 0;
								// if placing below would overflow viewport, try above
								if (top + sh > window.innerHeight - 8) {
									top = rect.top - offsetY - sh;
								}
								// clamp horizontally to viewport edges
								const minLeft = 8 + sw / 2;
								const maxLeft = window.innerWidth - 8 - sw / 2;
								if (left < minLeft) left = minLeft;
								if (left > maxLeft) left = maxLeft;
								span.style.position = 'fixed';
								span.style.left = left + 'px';
								span.style.top = top + 'px';
								span.style.transform = 'translate(-50%, 0)';
							}

							document.body.appendChild(span);
							// ensure layout is ready then position and show
							requestAnimationFrame(() => {
								positionOverlay();
								span.classList.add('visible');
							});

							// reposition on scroll/resize while visible
							const reposition = function () { if (document.body.contains(span)) positionOverlay(); };
							window.addEventListener('scroll', reposition, true);
							window.addEventListener('resize', reposition);

							// store cleanup handler so mouseleave can remove listeners
							span._repositionHandler = reposition;
						} catch (e) { /* ignore hover errors */ }
					});

					b.addEventListener('mouseleave', function (ev) {
						try {
							const existing = document.body.querySelector('.hover-message[data-src="' + b.id + '"]');
							if (existing) {
								existing.classList.remove('visible');
								// allow transition before removal
								setTimeout(() => {
									try { 
										if (existing._repositionHandler) {
											window.removeEventListener('scroll', existing._repositionHandler, true);
											window.removeEventListener('resize', existing._repositionHandler);
										}
										existing.remove();
								} catch (e) {}
							}, 180);
						}
						} catch (e) { /* ignore */ }
					});
					b.dataset.hoverAttached = '1';
				}

				// add an edit button if not present (but skip for Settings blob)
				 if (b.id !== 'interface__settings' && !b.querySelector('.edit-btn')) {
					 const btn = document.createElement('button');
					 btn.className = 'edit-btn';
					 btn.type = 'button';
					 btn.title = 'Edit';
					 btn.textContent = '✎';
					 btn.addEventListener('click', function (ev) {
						 ev.stopPropagation();
							 toggleEdit(b, btn);
					 });
					 b.appendChild(btn);
				 }

			 // click navigates to page or opens settings modal
				 b.addEventListener('click', function () {
					 if (b.id === 'interface__settings') {
						 openSeedModal();
						 return;
					 }
					 const dest = destinations[b.id] || 'basic.html';
					 window.location.href = dest;
					 });

			 // double-click toggles edit as well
				 b.addEventListener('dblclick', function (ev) {
					 ev.stopPropagation();
					 // double-click for settings also opens modal
					 if (b.id === 'interface__settings') {
						 openSeedModal();
						 return;
					 }
					 const btn = b.querySelector('.edit-btn');
					 if (btn) toggleEdit(b, btn);
					 });
		 }
	 }

		// Creates and opens a small modal allowing the user to edit the SEED value
		function openSeedModal() {
			// prevent multiple modals
			if (document.querySelector('.seed-modal-overlay')) return;

			const overlay = document.createElement('div');
			overlay.className = 'seed-modal-overlay';

			const modal = document.createElement('div');
			modal.className = 'seed-modal';

			const title = document.createElement('div');
			title.className = 'seed-modal-title';
			title.textContent = 'Settings';

			const row = document.createElement('div');
			row.className = 'seed-modal-row';
			const label = document.createElement('label');
			label.textContent = 'SEED:';
			label.setAttribute('for', 'seed-input');
			const input = document.createElement('input');
			input.id = 'seed-input';
			input.type = 'text';
			input.value = SEED || '';
			input.className = 'seed-input';

			// small shuffle button (svg) to generate a new random seed
			const btnShuffle = document.createElement('button');
			btnShuffle.type = 'button';
			btnShuffle.title = 'Shuffle seed';
			btnShuffle.className = 'seed-shuffle';
			btnShuffle.setAttribute('aria-label', 'Shuffle seed');
			btnShuffle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"/></svg>';

			row.appendChild(label);
			row.appendChild(input);
			row.appendChild(btnShuffle);

			const actions = document.createElement('div');
			actions.className = 'seed-modal-actions';
			const btnSave = document.createElement('button');
			btnSave.type = 'button';
			btnSave.className = 'seed-save';
			btnSave.textContent = 'Save';
		const btnResetNames = document.createElement('button');
		btnResetNames.type = 'button';
		btnResetNames.className = 'seed-cancel';
		btnResetNames.textContent = 'Reset names';
		const btnCancel = document.createElement('button');
		btnCancel.type = 'button';
		btnCancel.className = 'seed-cancel';
		btnCancel.textContent = 'Close';

			actions.appendChild(btnSave);
			actions.appendChild(btnResetNames);
			actions.appendChild(btnCancel);

			modal.appendChild(title);
			modal.appendChild(row);
			modal.appendChild(actions);
			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			// focus input
			setTimeout(() => input.focus(), 50);

			function closeModal() {
				try { document.body.removeChild(overlay); } catch (e) {}
				document.removeEventListener('keydown', keyHandler);
			}

			function saveAndClose() {
				const newSeed = String(input.value || '').trim();
				if (!newSeed) return; // don't accept empty
				SEED = newSeed;
				writeJsonCookie(SEED_COOKIE, SEED, 365);
				const seedInt = xmur3(SEED)();
				seededRandom = mulberry32(seedInt);
				assignRandomPositions();
				// show confirmation on settings blob
				const settingsBlob = document.getElementById('interface__settings');
				showSaveConfirmation(settingsBlob);
				closeModal();
			}

			btnSave.addEventListener('click', saveAndClose);
			// reset names handler: restore ORIGINAL_TEXTS into cookie and update DOM
			btnResetNames.addEventListener('click', function () {
				try {
					const saved = readJsonCookie(COOKIE_NAME) || {};
					const container = document.querySelector('.interface');
					if (!container) return;
					const blobs = Array.from(container.querySelectorAll(':scope > div'));
					blobs.forEach(b => {
						if (!b.id) return;
						if (b.id === 'interface__settings') return;
						const orig = ORIGINAL_TEXTS[b.id];
						const h = b.querySelector('h1');
						if (typeof orig !== 'undefined' && h) {
							h.textContent = orig;
							saved[b.id] = orig;
							showSaveConfirmation(b);
						}
					});
					writeJsonCookie(COOKIE_NAME, saved, 365);
				} catch (e) {}
			});

			// shuffle seed handler: generate new random seed, persist, update input and re-run layout
			btnShuffle.addEventListener('click', function () {
				const newSeed = String(Date.now()) + '-' + Math.floor(Math.random() * 1e9);
				SEED = newSeed;
				writeJsonCookie(SEED_COOKIE, SEED, 365);
				const seedInt = xmur3(SEED)();
				seededRandom = mulberry32(seedInt);
				assignRandomPositions();
				input.value = SEED;
				// show a small save confirmation on settings blob
				const settingsBlob = document.getElementById('interface__settings');
				showSaveConfirmation(settingsBlob);
			});
			btnCancel.addEventListener('click', closeModal);

			const keyHandler = function (ev) {
				if (ev.key === 'Escape') { ev.preventDefault(); closeModal(); }
				else if ((ev.key === 'Enter') && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); saveAndClose(); }
			};
			document.addEventListener('keydown', keyHandler);
		}

	function toggleEdit(blob, btn) {
		const isEditing = blob.getAttribute('contenteditable') === 'true';
		if (isEditing) {
			blob.removeAttribute('contenteditable');
			if (btn && btn.classList) btn.classList.remove('active');
			// try blur
			try { blob.blur(); } catch (e) {}
			// save text to cookie
			persistBlobText(blob);
		} else {
			// set editable but avoid editing the entire inner structure; allow editing of the H1 text
			blob.setAttribute('contenteditable', 'true');
			if (btn && btn.classList) btn.classList.add('active');
			// place caret inside the heading if possible
			const h = blob.querySelector('h1');
			if (h) {
				const range = document.createRange();
				const sel = window.getSelection();
				range.selectNodeContents(h);
				range.collapse(false);
				sel.removeAllRanges();
				sel.addRange(range);
				try { h.focus(); } catch (e) {}
			} else {
				try { blob.focus(); } catch (e) {}
			}

			// add a one-time keydown handler so Enter+Meta or Escape stops editing
			const keyHandler = function (ev) {
				if (ev.key === 'Escape') {
					ev.preventDefault();
					toggleEdit(blob, btn);
					document.removeEventListener('keydown', keyHandler, true);
				} else if ((ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey))) {
					ev.preventDefault();
					toggleEdit(blob, btn);
					document.removeEventListener('keydown', keyHandler, true);
				}
			};
			document.addEventListener('keydown', keyHandler, true);
		}
	}

	function persistBlobText(blob) {
		if (!blob.id) return;
		const h = blob.querySelector('h1');
		if (!h) return;
		// If settings blob, treat the H1 as the seed and persist to SEED_COOKIE
		if (blob.id === 'interface__settings') {
			const newSeed = String(h.textContent).trim();
			if (!newSeed) return;
			SEED = newSeed;
			writeJsonCookie(SEED_COOKIE, SEED, 365);
			// rebuild RNG and re-run layout with the new seed
			const seedInt = xmur3(SEED)();
			seededRandom = mulberry32(seedInt);
			assignRandomPositions();
			// show a small saved confirmation in the UI
			showSaveConfirmation(blob);
			return;
		}

		const saved = readJsonCookie(COOKIE_NAME) || {};
		saved[blob.id] = h.textContent;
		writeJsonCookie(COOKIE_NAME, saved, 365);
	}

	function showSaveConfirmation(blob) {
		if (!blob) return;
		let el = blob.querySelector('.save-confirmation');
		if (!el) {
			el = document.createElement('div');
			el.className = 'save-confirmation';
			el.textContent = 'Saved';
			blob.appendChild(el);
		}
		el.classList.add('show');
		setTimeout(() => el.classList.remove('show'), 1400);
	}

	 // initialize interactions after DOM ready
	 document.addEventListener('DOMContentLoaded', function () {
		 setupBlobInteractions();
	 });
	window.addEventListener('resize', function () {
		// re-evaluate connector lengths/angles after layout changes
		setTimeout(updateConnectorVars, 60);
	});

	// observe mutations that could affect layout (e.g., fonts/images load)
	const container = document.querySelector('.interface');
	if (container) {
		const mo = new MutationObserver(function () {
			assignRandomPositions();
		});
		mo.observe(container, { childList: true, subtree: true });
	}

})();

