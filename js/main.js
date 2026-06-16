'use strict';
/* global Monogatari */
/* global monogatari */

/**
 * =============================================================================
 * This is the file where you should put all your custom JavaScript code,
 * depending on what you want to do, there are 3 different places in this file
 * where you can add code.
 *
 * 1. Outside the $_ready function: At this point, the page may not be fully
 *    loaded yet, however you can interact with Monogatari to register new
 *    actions, components, labels, characters, etc.
 *
 * 2. Inside the $_ready function: At this point, the page has been loaded, and
 *    you can now interact with the HTML elements on it.
 *
 * 3. Inside the init function: At this point, Monogatari has been initialized,
 *    the event listeners for its inner workings have been registered, assets
 *    have been preloaded (if enabled) and your game is ready to be played.
 *
 * You should always keep the $_ready function as the last thing on this file.
 * =============================================================================
 **/

const { $_ready, $_ } = Monogatari;

// 1. Outside the $_ready function:

/*
CLASSI CUSTOM
*/

class TypeCentered extends Monogatari.Action {
	static id = 'TypeCentered';

	static matchObject (statement) {
		return typeof statement.TypeCentered !== 'undefined';
	}

	constructor (statement) {
		super ();

		const options = typeof statement.TypeCentered === 'string'
			? { text: statement.TypeCentered }
			: statement.TypeCentered;

		this.text = options.text ?? '';
		this.speed = options.speed ?? 55;
		this.sound = options.sound ?? 'assets/sounds/typewriter.mp3';
		this.volume = options.volume ?? 0.25;
		this.fontFamily = options.fontFamily ?? 'monospace';
	}

	apply () {
		return new Promise ((resolve) => {
			const root = document.querySelector ('#monogatari') ?? document.body;

			const container = document.createElement ('div');
			container.classList.add ('type-centered-container');

			container.style.position = 'fixed';
			container.style.inset = '0';
			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.style.justifyContent = 'center';
			container.style.textAlign = 'center';
			container.style.padding = '2rem';
			container.style.zIndex = '9999';
			container.style.color = 'white';
			container.style.background = 'transparent';
			container.style.cursor = 'pointer';

			const paragraph = document.createElement ('div');
			paragraph.classList.add ('type-centered-text');

			paragraph.style.maxWidth = '1000px';
			paragraph.style.fontSize = 'clamp(1.4rem, 3vw, 3rem)';
			paragraph.style.lineHeight = '1.5';
			paragraph.style.fontFamily = this.fontFamily;
			paragraph.style.whiteSpace = 'pre-wrap';

			container.appendChild (paragraph);
			root.appendChild (container);

			const audio = new Audio (this.sound);
			audio.loop = true;
			audio.volume = this.volume;

			let index = 0;
			let finishedTyping = false;
			let interval = null;

			const stopTypingSound = () => {
				audio.pause ();
				audio.currentTime = 0;
			};

			const finishImmediately = () => {
				paragraph.textContent = this.text;
				finishedTyping = true;

				if (interval) {
					clearInterval (interval);
					interval = null;
				}

				stopTypingSound ();
			};

			const closeAndContinue = () => {
				container.remove ();
				resolve ();
			};

			const onClick = () => {
				if (!finishedTyping) {
					finishImmediately ();
					return;
				}

				closeAndContinue ();
			};

			container.addEventListener ('click', onClick);

			audio.play ().catch (() => {
				// Se il browser blocca l'audio, il testo continua comunque.
			});

			interval = setInterval (() => {
				paragraph.textContent += this.text[index];
				index++;

				if (index >= this.text.length) {
					finishedTyping = true;
					clearInterval (interval);
					interval = null;
					stopTypingSound ();
				}
			}, this.speed);
		});
	}

	didApply () {
		return Promise.resolve ({
			advance: true
		});
	}

	revert () {
		return Promise.resolve ();
	}

	didRevert () {
		return Promise.resolve ({
			advance: true,
			step: true
		});
	}
}

// Custom action per mostrare le scelte direttamente dentro la chat del telefono.
class PhoneChoice extends Monogatari.Action {
	static id = 'PhoneChoice';

	static matchObject (statement) {
		return typeof statement.PhoneChoice !== 'undefined';
	}

	constructor (statement) {
		super ();

		// Salviamo la configurazione ricevuta dallo script Monogatari.
		this.statement = statement.PhoneChoice;
		this.container = null;
		this.hasChosen = false;
	}

	apply () {
		if (!PhoneUI.layer) PhoneUI.init ();

		/*
			PhoneChoice prepara i pulsanti dentro la chat, ma NON apre piu' il telefono da sola.
			Cosi' un messaggio in arrivo puo restare una semplice notifica: badge + lockscreen.
			Se il telefono era gia' aperto per scelta della scena/utente, allora portiamo alla chat.
		*/
		PhoneUI.setContactName (this.statement.Contact ?? PhoneUI.getContactName ());

		if (PhoneUI.isVisible ()) {
			PhoneUI.showChatView ();
		}

		this.removeExistingChoices ();

		// Come la Choice standard di Monogatari, blocchiamo l'avanzamento automatico.
		monogatari.global ('block', true);

		const container = document.createElement ('div');
		container.className = 'phone-choice-container';
		container.dataset.phoneChoiceContainer = 'true';

		this.getChoices ().forEach ((choice) => {
			const button = document.createElement ('button');
			button.type = 'button';
			button.className = 'phone-choice-button';
			button.textContent = choice.text;

			if(choice.disabled){
				button.disabled = true;
				button.style.opacity = '0.45';
				button.style.cursor = 'default';
			}
			else
				button.addEventListener ('click', (event) => this.choose (choice, event));

			container.appendChild (button);
		});

		PhoneUI.chat.appendChild (container);
		PhoneUI.chat.scrollTop = PhoneUI.chat.scrollHeight;
		PhoneUI.layer.classList.add ('choice-active');
		this.container = container;

		return Promise.resolve ();
	}

	getChoices () {
		// Convertiamo l'oggetto scritto in script.js in una lista semplice di pulsanti.
		return Object.entries (this.statement)
			// Contact e Class sono opzioni della custom action, non pulsanti da mostrare.
			.filter (([key]) => !['Contact', 'Class'].includes (key))
			.map (([key, value]) => {
				if (typeof value === 'string') {
					return {
						text: key,
						doAction: value,
						disabled: false
					};
				}

				return {
					text: value.Text ?? key,
					doAction: value.Do,
					onChosen: value.onChosen,
					disabled: value.Disabled ?? false // propaga disabled all'action
				};
			});
	}

	async choose (choice, event) {
		// Impediamo al click di passare alla schermata di gioco dietro al telefono.
		event.preventDefault ();
		event.stopPropagation ();

		if (this.hasChosen) return;
		this.hasChosen = true;

		this.disableButtons ();
		this.removeExistingChoices ();

		try {
			if (typeof choice.onChosen === 'function') {
				await choice.onChosen ();
			}

			// Sblocchiamo Monogatari e facciamo eseguire l'azione collegata al pulsante.
			monogatari.global ('block', false);

			if (choice.doAction) {
				await monogatari.run (choice.doAction);
			}
		} catch (error) {
			monogatari.global ('block', false);
			console.error ('Errore durante PhoneChoice:', error);
		}
	}

	disableButtons () {
		// Dopo il click disabilitiamo tutto per evitare doppie esecuzioni.
		if (!this.container) return;

		this.container.querySelectorAll ('button').forEach ((button) => {
			button.disabled = true;
		});
	}

	removeExistingChoices () {
		// Pulizia difensiva: puo' esserci una sola scelta telefonica alla volta.
		if (!PhoneUI.chat) return;

		PhoneUI.chat.querySelectorAll ('[data-phone-choice-container]').forEach ((element) => {
			element.remove ();
		});

		if (PhoneUI.layer) {
			PhoneUI.layer.classList.remove ('choice-active');
		}
	}

	didApply () {
		return Promise.resolve ({
			advance: false,
			step: false
		});
	}

	revert () {
		this.removeExistingChoices ();
		monogatari.global ('block', false);

		return Promise.resolve ();
	}

	didRevert () {
		return Promise.resolve ({
			advance: true,
			step: true
		});
	}
}

monogatari.registerAction (TypeCentered);
monogatari.registerAction (PhoneChoice);

/*
OGGETTI CUSTOM
*/

const PhoneUI = {
	/*
		Riferimenti DOM principali.
		Restano null finche init() non viene chiamato: cosi' il codice puo essere caricato
		prima che il browser abbia finito di costruire tutta la pagina.
	*/
    layer: null,
    shell: null,
    chatView: null,
    lockView: null,
    chat: null,
    contact: null,
    statusTime: null,
    lockTime: null,
    lockDate: null,
    lockNotifications: null,
    statusClockTimer: null,
	unlockEventsBound: false,

	/*
		Stato interno del telefono.
		- mode: vista attuale del telefono ("lockscreen" o "chat").
		- unreadNotifications: unica fonte di verita' per badge e notifiche in lockscreen.
		- notificationId: contatore semplice per assegnare un id stabile a ogni notifica.
	*/
	mode: 'lockscreen',
	unreadNotifications: [],
	notificationId: 0,

    init() {
        this.layer = document.getElementById('phone-layer');
        this.shell = document.getElementById('phone-shell');
        this.chatView = document.getElementById('phone-chat-view');
        this.lockView = document.getElementById('phone-lock-view');
        this.chat = document.getElementById('phone-chat');
        this.contact = document.getElementById('phone-contact');
        this.statusTime = document.getElementById('phone-status-time');
        this.lockTime = document.getElementById('lock-time');
        this.lockDate = document.getElementById('phone-lock-date');
        this.lockNotifications = document.getElementById('phone-lock-notifications');

		// La lockscreen si puo cliccare/toccare per passare alla chat e segnare i messaggi come letti.
		this.bindLockscreenEvents();

		// Disegno iniziale: se non ci sono notifiche, il contenitore resta vuoto.
		this.renderNotifications();
        this.applyMode();
        this.updateClock();
    },

    show(contactName = 'Giulia', options = {}) {
        if (!this.layer) this.init();

		/*
			Di default il telefono si apre sempre in lockscreen, come richiesto.
			Se una scena deve forzare la chat, puo usare:
			PhoneUI.show('Giulia', { mode: 'chat' })
			oppure PhoneUI.showChatView().
		*/
		const requestedMode = options.mode ?? 'lockscreen';

        this.setContactName(contactName);
		this.setMode(requestedMode);

        this.startClock();
        this.layer.classList.add('visible');
        this.layer.setAttribute('aria-hidden', 'false');

		// Mantiene sincronizzato lo stato premuto del pulsante globale.
		if (typeof PhoneToggle !== 'undefined') {
			PhoneToggle.setExpanded(true);
		}
    },

	showLockScreen(contactName = null) {
		if (!this.layer) this.init();

		// Se non viene passato un contatto, manteniamo l'ultimo mostrato nella chat.
		const nextContactName = contactName ?? this.getContactName();
		this.show(nextContactName, { mode: 'lockscreen' });
	},

    getContactName() {
        if (!this.contact) this.init();

        return this.contact.textContent || 'Giulia';
    },

	setContactName(contactName = 'Giulia') {
		if (!this.contact) this.init();

		// Un solo punto per cambiare il nome del contatto: utile se in futuro avrai piu chat.
		this.contact.textContent = contactName || 'Giulia';
	},

	isVisible() {
		if (!this.layer) this.init();

		return this.layer.classList.contains('visible');
	},

    hide() {
        if (!this.layer) this.init();

        // Chiudendo il telefono disattiviamo anche i click delle scelte telefoniche.
        this.layer.classList.remove('visible', 'choice-active');
        this.layer.setAttribute('aria-hidden', 'true');
        this.stopVibration();
        this.stopClock();

		if (typeof PhoneToggle !== 'undefined') {
			PhoneToggle.setExpanded(false);
		}
    },

	toggleFromButton() {
		if (this.isVisible()) {
			this.hide();
			return;
		}

		// Il pulsante globale apre sempre dalla lockscreen, anche se prima eri nella chat.
		this.showLockScreen();
	},

    reset(options = {}) {
        if (!this.layer) this.init();

		const clearNotifications = options.clearNotifications ?? true;

        this.chat.innerHTML = '';

        // Resettare la chat rimuove i pulsanti, quindi togliamo anche lo stato interattivo.
        this.layer.classList.remove('choice-active');

		// Nella maggior parte delle scene reset() prepara una nuova conversazione.
		// Se vuoi pulire la chat ma tenere il badge, usa PhoneUI.reset({ clearNotifications: false }).
		if (clearNotifications) {
			this.clearNotifications();
		}
    },

    addIncoming(text, options = {}) {
        this.addBubble(text, 'incoming');

		/*
			Regola principale del sistema notifiche:
			ogni addIncoming() aggiunge automaticamente notifiche non lette.

			Uso base:
			PhoneUI.addIncoming('Ciao'); // +1 notifica

			Uso avanzato:
			PhoneUI.addIncoming('Ciao', { notificationCount: 3 }); // +3 notifiche
			PhoneUI.addIncoming('Ciao', { notify: false }); // nessuna notifica
		*/
		const notificationCount = this.getIncomingNotificationCount(options);

		for (let index = 0; index < notificationCount; index++) {
			this.addNotification({
				title: options.title ?? this.getContactName(),
				body: text
			});
		}
    },

	getIncomingNotificationCount(options = {}) {
		// notify: false e' il modo piu chiaro per dire "mostra il messaggio ma non notificare".
		if (options.notify === false) {
			return 0;
		}

		/*
			notificationCount controlla quante notifiche aggiungere per questo messaggio.
			"notifications" e' accettato come alias, nel caso venga piu naturale scriverlo cosi'.
		*/
		const rawCount = options.notificationCount ?? options.notifications ?? 1;
		const count = Number(rawCount);

		// Se arriva un valore non numerico, torniamo al comportamento semplice: +1 notifica.
		if (!Number.isFinite(count)) {
			return 1;
		}

		// Math.floor evita mezze notifiche; Math.max impedisce numeri negativi.
		return Math.max(0, Math.floor(count));
	},

    addOutgoing(text) {
        this.addBubble(text, 'outgoing');
    },

    addBubble(text, type) {
        if (!this.layer) this.init();

        const bubble = document.createElement('div');
        bubble.className = `phone-bubble ${type}`;
        bubble.textContent = text;

        this.chat.appendChild(bubble);
        this.chat.scrollTop = this.chat.scrollHeight;
    },

	addNotification(notification = {}, clickable = true) {
		if (!this.layer) this.init();

		const title = notification.title ?? this.getContactName();
		const body = notification.body ?? '';

		this.notificationId += 1;

		this.unreadNotifications.push({
			id: this.notificationId,
			title,
			body,
			clickable
		});

		this.renderNotifications();
	},

	addPlaceholder(){
		const item = document.createElement('div');
			item.className = 'lock-notification';

			const icon = document.createElement('div');
			icon.className = 'lock-notification-icon';
			icon.setAttribute('aria-hidden', 'true');

			const text = document.createElement('div');
			text.className = 'lock-notification-text';

			const title = document.createElement('div');
			title.className = 'lock-notification-title';
			title.textContent = "Nessun nuovo messaggio.";

			const subtitle = document.createElement('div');
			subtitle.className = 'lock-notification-subtitle';
			subtitle.textContent = "Messaggi";

			text.appendChild(title);
			text.appendChild(subtitle);
			item.appendChild(icon);
			item.appendChild(text);
			item.setAttribute('pointer-events', 'none');
			this.lockNotifications.appendChild(item);
	},

	clearNotifications() {
		this.unreadNotifications = [];
		this.renderNotifications();
	},

	markNotificationsAsRead() {
		// Alias piu leggibile quando la causa e' l'apertura della chat.
		this.clearNotifications();
	},

	getUnreadCount() {
		return this.unreadNotifications.length;
	},

	renderNotifications() {
		if (!this.lockNotifications) return;

		this.lockNotifications.innerHTML = '';
		this.lockNotifications.classList.toggle('is-empty', this.unreadNotifications.length === 0);

		/*
			Ogni notifica mostrata qui corrisponde a 1 numero nel badge.
			Se vuoi raggruppare piu messaggi in una sola card, questo e' il punto da modificare.
		*/
		this.unreadNotifications.forEach((notification) => {
			const item = document.createElement('div');
			item.className = 'lock-notification';

			const icon = document.createElement('div');
			icon.className = 'lock-notification-icon';
			icon.setAttribute('aria-hidden', 'true');

			const text = document.createElement('div');
			text.className = 'lock-notification-text';

			const title = document.createElement('div');
			title.className = 'lock-notification-title';
			title.textContent = notification.title;

			const subtitle = document.createElement('div');
			subtitle.className = 'lock-notification-subtitle';
			subtitle.textContent = notification.body;

			text.appendChild(title);
			text.appendChild(subtitle);
			item.appendChild(icon);
			item.appendChild(text);
			this.lockNotifications.appendChild(item);
		});

		if (typeof PhoneToggle !== 'undefined') {
			PhoneToggle.updateBadge(this.getUnreadCount());
		}
	},

	bindLockscreenEvents() {
		if (!this.lockView || this.unlockEventsBound) return;

		const unlock = (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.unlockFromLockscreen();
		};

		this.lockView.addEventListener('click', unlock);

		/*
			Su iOS Safari i div senza cursor:pointer non ricevono click.
			touchend garantisce l'interazione su tutti i browser mobile;
			preventDefault() sopprime il click sintetico successivo per evitare doppio unlock.
		*/
		this.lockView.addEventListener('touchend', unlock);

		this.lockView.addEventListener('keydown', (event) => {
			const key = event.key || '';

			if (key === 'Enter' || key === ' ') {
				unlock(event);
			}
		});

		this.unlockEventsBound = true;
	},

	unlockFromLockscreen() {
		// Se la chat e' gia aperta, non facciamo nulla.
		if (this.mode !== 'lockscreen') return;

		this.showChatView({ markNotificationsAsRead: true });
	},

    vibrate(duration = 900) {
        if (!this.layer) this.init();

        this.shell.classList.add('vibrating');

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        setTimeout(() => {
            this.stopVibration();
        }, duration);
    },

    stopVibration() {
        if (!this.shell) return;
        this.shell.classList.remove('vibrating');
    },

    startClock() {
        this.updateClock();

        if (this.statusClockTimer) return;

        // Aggiorniamo ogni secondo: l'orario resta preciso anche se il telefono resta aperto.
        this.statusClockTimer = setInterval(() => {
            this.updateClock();
        }, 1000);
    },

    stopClock() {
        if (!this.statusClockTimer) return;

        clearInterval(this.statusClockTimer);
        this.statusClockTimer = null;
    },

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        if (this.statusTime) {
            this.statusTime.textContent = currentTime;
        }

        if (this.lockTime) {
            this.lockTime.textContent = currentTime;
        }

        if (this.lockDate) {
            this.lockDate.textContent = now.toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    },

    setMode(mode = 'chat') {
        if (!this.layer) this.init();

        // Accettiamo anche "lock" come alias breve, ma salviamo sempre "lockscreen".
        const normalizedMode = mode === 'lock' ? 'lockscreen' : mode;

        if (!['chat', 'lockscreen'].includes(normalizedMode)) {
            console.warn(`Modalita telefono non valida: ${mode}`);
            return this.mode;
        }

        this.mode = normalizedMode;
        this.applyMode();

        return this.mode;
    },

    showChatView(options = {}) {
		const markNotificationsAsRead = options.markNotificationsAsRead ?? true;
        const mode = this.setMode('chat');

		if (markNotificationsAsRead) {
			this.markNotificationsAsRead();
		}

		return mode;
    },

    switchMode() {
        if (!this.layer) this.init();

        const nextMode = this.mode === 'chat' ? 'lockscreen' : 'chat';

		if (nextMode === 'chat') {
			return this.showChatView();
		}

        return this.setMode(nextMode);
    },

    applyMode() {
        if (!this.chatView || !this.lockView) return;

        const isLockscreen = this.mode === 'lockscreen';

        // La chat deve restare flex per mantenere header e messaggi nello stesso layout.
        this.chatView.style.display = isLockscreen ? 'none' : 'flex';

        // La lockscreen e' un blocco unico: il figlio .phone-lock gestisce il layout interno.
        this.lockView.style.display = isLockscreen ? 'block' : 'none';

        if (this.layer) {
            this.layer.dataset.phoneMode = this.mode;
        }
    }
};

const PhoneToggle = {
	/*
		Controller del pulsante globale.
		Questo oggetto non gestisce i messaggi: mostra/nasconde solo il bottone,
		inoltra il click a PhoneUI e aggiorna il badge numerico.
	*/
	root: null,
	button: null,
	badge: null,
	eventsBound: false,
	visibilityObserver: null,
	refreshQueued: false,

	init() {
		this.root = document.getElementById('phone-toggle');
		this.button = document.getElementById('phone-toggle-button');
		this.badge = document.getElementById('phone-toggle-badge');

		if (!this.root || !this.button || !this.badge) return;

		this.bindEvents();
		this.observeScreenChanges();
		this.updateBadge(PhoneUI.getUnreadCount());
		this.refreshVisibility();
	},

	bindEvents() {
		if (this.eventsBound || !this.button) return;

		this.button.addEventListener('click', (event) => {
			// Il pulsante e' sopra il gioco: blocchiamo il click per non avanzare dialoghi dietro.
			event.preventDefault();
			event.stopPropagation();
			PhoneUI.toggleFromButton();
		});

		this.eventsBound = true;
	},

	observeScreenChanges() {
		if (this.visibilityObserver || !document.body) return;

		/*
			Monogatari cambia visibilita/classi/attributi sugli screen invece di ricaricare pagina.
			MutationObserver ci permette di nascondere il pulsante quando torna il menu principale.
		*/
		this.visibilityObserver = new MutationObserver(() => {
			this.queueRefreshVisibility();
		});

		this.visibilityObserver.observe(document.body, {
			attributes: true,
			subtree: true,
			attributeFilter: ['class', 'style', 'data-screen', 'aria-hidden']
		});
	},

	queueRefreshVisibility() {
		if (this.refreshQueued) return;

		this.refreshQueued = true;

		requestAnimationFrame(() => {
			this.refreshQueued = false;
			this.refreshVisibility();
		});
	},

	refreshVisibility() {
		if (!this.root || !this.button) return;

		const shouldShow = this.shouldShowInCurrentScreen();

		this.root.classList.toggle('visible', shouldShow);
		this.root.setAttribute('aria-hidden', String(!shouldShow));
		this.button.disabled = !shouldShow;

		// Nel menu principale il telefono non deve restare aperto nemmeno se era visibile prima.
		if (!shouldShow && PhoneUI.layer && PhoneUI.isVisible()) {
			PhoneUI.hide();
		}
	},

	shouldShowInCurrentScreen() {
		/*
			Regola principale: Monogatari mette .active sullo screen corrente.
			Il pulsante deve comparire solo quando lo screen attivo e' quello di gioco.
		*/
		const activeScreen = document.querySelector('[data-screen].active');

		if (activeScreen) {
			return activeScreen.dataset.screen === 'game';
		}

		const mainScreen = document.querySelector('[data-screen="main"], main-screen');
		const gameScreen = document.querySelector('[data-screen="game"], game-screen');
		const mainIsVisible = this.isElementVisible(mainScreen);
		const gameIsVisible = this.isElementVisible(gameScreen);

		if (mainIsVisible && !gameIsVisible) {
			return false;
		}

		if (gameIsVisible) {
			return true;
		}

		/*
			Fallback difensivo: se Monogatari cambia markup in futuro, il label corrente
			ci dice comunque che una scena e' partita.
		*/
		try {
			const currentLabel = typeof monogatari.state === 'function'
				? monogatari.state('label')
				: null;

			return Boolean(currentLabel) && !mainIsVisible;
		} catch (error) {
			return false;
		}
	},

	isElementVisible(element) {
		if (!element) return false;

		const style = window.getComputedStyle(element);
		const rect = element.getBoundingClientRect();

		return style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0' &&
			rect.width > 0 &&
			rect.height > 0;
	},

	updateBadge(count = 0) {
		if (!this.root || !this.badge) return;

		const safeCount = Math.max(0, Number(count) || 0);
		const hasNotifications = safeCount > 0;

		this.root.classList.toggle('has-notifications', hasNotifications);
		this.badge.textContent = hasNotifications ? String(Math.min(safeCount, 99)) : '';
		this.badge.setAttribute('aria-hidden', String(!hasNotifications));

		if (this.button) {
			const label = hasNotifications
				? `Apri telefono, ${safeCount} notifiche non lette`
				: 'Apri telefono';

			this.button.setAttribute('aria-label', label);
		}
	},

	setExpanded(isExpanded) {
		if (!this.button) return;

		this.button.setAttribute('aria-pressed', String(isExpanded));
	}
};

const NightOverlay = {
	element: null,
	radius: 120,
	hasPlayedSound: false,
	isFrozen: true,
	torchSound: new Audio('assets/sounds/torch-click.mp3'),

	//Posizione attuale della torica
	torchX: window.innerWidth /2,
	torchY: window.innerHeight / 2,

	//Posizione target (dita o mouse)
	targetX: window.innerWidth /2,
	targetY: window.innerHeight / 2,

	init(){
		this.element = document.getElementById('night-overlay');
		
		//Desktop (capire se serve)
		document.addEventListener('mousemove', (e) => {
			if(!this.element.classList.contains('torch')) return;
			this.updateTorch(e.clientX, e.clientY);	//Per il mouse non serve il target perchè tanto il movimento è sempre fluido e costante
		});

		//Mobile
		document.addEventListener('touchstart', (e) => {
			if(!this.element.classList.contains('torch')) return;
			const touch = e.touches[0];
			//this.updateTorch(touch.clientX, touch.clientY);	//old
			this.targetX = touch.clientX;
			this.targetY = touch.clientY;
		});

		document.addEventListener('touchmove', (e) => {
			if(!this.element.classList.contains('torch')) return;
			const touch = e.touches[0];
			// this.updateTorch(touch.clientX, touch.clientY);	//old
			this.targetX = touch.clientX;
			this.targetY = touch.clientY;
		});

		this.loop();
	},

	loop(){			
		const speed = 0.15;

		if(!this.isFrozen){		
			// LERP verso il target (LERP = Linear Interpolation)
			this.torchX = lerp(this.targetX, this.torchX, speed);
			this.torchY = lerp(this.targetY, this.torchY, speed);

			//Aggiorno la torcia
			this.updateTorch(this.torchX, this.torchY);
		}

		requestAnimationFrame(() => this.loop());
	},

	showNight(){
		if(!this.element) this.init();
		
		this.element.classList.add('visible');
		this.element.classList.remove('torch');

		this.element.style.maskImage = 'none';
		this.element.style.webkitMaskImage = 'none';
	},

	showTorch(){
		this.isFrozen = false;
		this.element.classList.add('visible');
		this.element.classList.add('torch');

		const x = window.innerWidth / 2;
    	const y = window.innerHeight / 2;

    	this.updateTorch(x, y);

		// Debug sui click
		// document.addEventListener("click", (e) => {
   		// 	console.log("CLICK SU ELEMENTO:", e.target);
		// });
	},

	hide(){
		if(!this.element) this.init();
		
		this.element.classList.remove('visible');		
	},

	hideTorch(){
		if(!this.element) this.init();

		this.playTorchSound();
		this.element.classList.remove('torch');
	},

	playTorchSound(){
		this.torchSound.currentTime = 0;
		this.torchSound.volume = 1;
		this.torchSound.play();
		this.hasPlayedSound = true;
	},

	updateTorch(x,y){
		if(this.isFrozen) return;
		//Riproduco suono solo alla prima volta del metodo
		if(!this.hasPlayedSound){
			this.playTorchSound();
		}

		const mask = `
			radial-gradient(
				circle ${this.radius}px at ${x}px ${y}px,

				/* Centro molto luminoso */
				rgba(0,0,0,0) 0%,
				rgba(0,0,0,0.02) 10%,

				/* Decadimento lento (curva piatta) */
				rgba(0,0,0,0.08) 25%,
				rgba(0,0,0,0.18) 40%,

				/* Decadimento più veloce */
				rgba(0,0,0,0.35) 55%,
				rgba(0,0,0,0.55) 70%,

				/* Crollo finale (curva ripida) */
				rgba(0,0,0,0.75) 85%,
				rgba(0,0,0,1) 100%
			)
		`;

		this.element.style.maskImage = mask;
        this.element.style.webkitMaskImage = mask;

		document.querySelectorAll('.clickable-object').forEach(obj => {
			const rect = obj.getBoundingClientRect();

			const objCenterX = rect.left + rect.width / 2;
			const objCenterY = rect.top + rect.height / 2;

			const dx = objCenterX - x;
			const dy = objCenterY - y;

			const distance = Math.sqrt(dx*dx + dy*dy);

			if(distance < this.radius)
				obj.classList.add('highlight');
			else
				obj.classList.remove('highlight');
		})
	}
};

//G - Animazione fatta armandomi di codex, ho commentato il più possibile per renderla manutenibile, in ogni caso per qualsiasi aggiustamento cambiare i parametri in config
const Glitch={
	active: false,
	timer: null,
	startTime: 0,
	intensity: 0,
	currentPhaseIndex: 0,
	phaseResolved: false,
	zoom: 1,
	gameOverOverlay: null,

	//L'ordine è importante, è dal z-index inferiore al superiore.
	//Se ci sono altri elementi nel DOM in questa scena a cui aggiungere l'animazione di shake, aggiungere qui.
	sceneLayerSelectors: [
		"#sky",
		"#background",
		"#details-wrapper"
	],

	shakeViewport: null,
	shakeWrapper: null,
	originalLayerPositions: new Map(),
	originalWrapperTransform: "",

	config: {
		// Quanto velocemente cresce la rabbia.
		intensityStep: 0.009,

		// Timing generale del loop.
		baseDelay: 90,
		minDelay: 35,
		delayRamp: 58,

		// Quanti px max di spostamento durante lo shake dello schermo
		maxShakePx: 30,

		// Tempo di zoom e esponenzialità con cui cresce.
		rampDuration: 10000,
		rampExponent: 2.2,

		// Zoom emotivo: piccolo all'inizio, poi cresce di più nella fase finale.
		baseZoomExtra: 0.018,
		rageZoomExtra: 0.055,

		// Rotazione massima casuale.
		rotationMaxDeg: 1.8,

		// Distorsione su asse x (stretch) e y (squeeze).
		stretchMax: 0.028,
		squeezeMax: 0.022,

		// Ogni tanto inserisce un colpo più sporco e improvviso.
		spikeChance: 0.16,
		spikeMultiplier: 1.65
	},

	phases: [
		{
			label: "fase1",
			timeLimit: 10000,
			spawnDelay: 850,
			intensityStart: 0.14,
			intensityStepMultiplier: 0.9,
			baseDelay: 90,
			minDelay: 46,
			delayRamp: 42,
			maxShakePx: 16,
			baseZoomExtra: 0.012,
			rageZoomExtra: 0.024,
			spikeChance: 0.08,
			spikeMultiplier: 1.2
		},
		{
			label: "fase2",
			timeLimit: 8600,
			spawnDelay: 600,
			intensityStart: 0.32,
			intensityStepMultiplier: 1.22,
			baseDelay: 72,
			minDelay: 34,
			delayRamp: 56,
			maxShakePx: 24,
			baseZoomExtra: 0.018,
			rageZoomExtra: 0.04,
			spikeChance: 0.14,
			spikeMultiplier: 1.45
		},
		{
			label: "fase3",
			timeLimit: 6200,
			spawnDelay: 420,
			intensityStart: 0.52,
			intensityStepMultiplier: 1.55,
			baseDelay: 56,
			minDelay: 22,
			delayRamp: 72,
			maxShakePx: 34,
			baseZoomExtra: 0.025,
			rageZoomExtra: 0.062,
			spikeChance: 0.2,
			spikeMultiplier: 1.75
		}
	],

//Implemento un wrapper che contiene i vari elementi del DOM in questa scena, così da applicare le trasformazioni al wrapper e non ad ogni elemento singolarmente
//GESTIONE WRAPPER
	prepareShakeWrapper() {
		if (this.shakeWrapper?.isConnected) {
			return true;
		}

		const layers = this.sceneLayerSelectors
			.map(selector => document.querySelector(selector))
			.filter(layer => layer);

		if (!layers.length) {
			return false;
		}

		let viewport = document.getElementById("glitch-shake-viewport");
		let wrapper = document.getElementById("glitch-shake-wrapper");

		if (!viewport) {
			viewport = document.createElement("div");
			viewport.id = "glitch-shake-viewport";
		}

		if (!wrapper) {
			wrapper = document.createElement("div");
			wrapper.id = "glitch-shake-wrapper";
		}

		const firstLayer = layers[0];
		firstLayer.parentNode.insertBefore(viewport, firstLayer);

		if (!viewport.contains(wrapper)) {
			viewport.appendChild(wrapper);
		}

		this.originalLayerPositions.clear();

		layers.forEach(layer => {
			const placeholder = document.createComment(`glitch-placeholder:${layer.id || layer.className || "layer"}`);

			layer.parentNode.insertBefore(placeholder, layer);

			this.originalLayerPositions.set(layer, {
				placeholder,
				inlinePosition: layer.style.position,
				inlineInset: layer.style.inset,
				inlineWidth: layer.style.width,
				inlineHeight: layer.style.height
			});

			wrapper.appendChild(layer);
		});

		this.shakeViewport = viewport;
		this.shakeWrapper = wrapper;
		this.originalWrapperTransform = wrapper.style.transform || "";

		wrapper.style.willChange = "transform";

		return true;
	},

	applySceneTransform(glitchTransform) {
		if (!this.shakeWrapper?.isConnected) {
			if (!this.prepareShakeWrapper()) {
				return;
			}
		}

		this.shakeWrapper.style.transform =
			`${this.originalWrapperTransform} ${glitchTransform}`.trim();
	},

	restoreSceneTransforms() {
		if (!this.shakeWrapper) {
			return;
		}

		this.shakeWrapper.style.transform = this.originalWrapperTransform;
		this.shakeWrapper.style.willChange = "";

		this.originalLayerPositions.forEach((position, layer) => {
			if (!position.placeholder?.parentNode) {
				return;
			}

			position.placeholder.parentNode.insertBefore(layer, position.placeholder);
			position.placeholder.remove();

			layer.style.position = position.inlinePosition;
			layer.style.inset = position.inlineInset;
			layer.style.width = position.inlineWidth;
			layer.style.height = position.inlineHeight;
		});

		if (this.shakeViewport) {
			this.shakeViewport.remove();
		}

		this.shakeViewport = null;
		this.shakeWrapper = null;
		this.originalWrapperTransform = "";
		this.originalLayerPositions.clear();
	},

//INIZIO GLITCH
	async start(){
		if (this.active) return;

		if (!this.prepareShakeWrapper()) {
			return;
		}	

		const store = monogatari.storage();
		store.glitchGameCompleted = false;
		store.glitchGamePhase = 1;

		this.active = true;
		this.phaseResolved = false;
		this.currentPhaseIndex = 0;
		
		this.ensureGameOverOverlay();

		try {
			//Gestione delle fasi fino al loro completamento
			while (this.currentPhaseIndex < this.phases.length && this.active) {
				const phase = this.phases[this.currentPhaseIndex];
				store.glitchGamePhase = this.currentPhaseIndex + 1;

				this.beginPhase(phase);
				
				const result = await WordsGame.start(phase);
				this.endPhaseVisuals();

				if (!this.active) {
					return false;
				}

				if (result.success) {
					this.currentPhaseIndex += 1;
					switch (this.currentPhaseIndex){
						case 1: 
							await this.cooldown(700, 0.16);
							break;
						case 2: 
							await this.cooldown(400, 0.05);
							break;
						default:
							break;
					}
				} else {
					const isTimeout = result.reason === "timeout";
					const isFirstPhase = this.currentPhaseIndex === 0;

					// Fallimento fase 1:
					// niente overlay rosso cinematografico, solo shake delle parole
					// e poi reset normale.
					if (isTimeout && isFirstPhase) {
						await this.playFirstPhaseFailFeedback();
						await this.cooldown(520, 0);
					}

					// Fallimento fasi successive:
					// niente shake parole, solo game over cinematografico completo.
					if (isTimeout && !isFirstPhase) {
						await this.playGameOverSequence();
						WordsGame.clearVisibleWords();
						await this.cooldown(700, 0);
						await this.playRestartFadeOut();
					}

					this.resetToFirstPhase();
				}
			}
			if (!this.active) return false;

			store.glitchGameCompleted = true;
			await this.stop(true);
			return true;
		} catch (error) {
			await this.stop(false);
			throw error;
		}
	},

	//Fa partire la fase
	beginPhase(phase) {
		this.phaseResolved = false;
		this.intensity = phase.intensityStart;
		this.startTime = performance.now();
		this.runLoop(phase);
	},

	runLoop(phase) {
		if (!this.shakeWrapper?.isConnected) {
			if (!this.prepareShakeWrapper()) {
				return;
			}
		}

		//Core animazione
		const loop = () => {
			if (!this.active || this.phaseResolved) return;

			const now = performance.now();
			const elapsed = now - this.startTime;

			// Progressione reale della fase: 0 all'inizio, 1 allo scadere del tempo.
			const phaseProgress = Math.min(1, elapsed / phase.timeLimit);

			// Sincronizzo l'intensità del glitch con quella del minigioco
			WordsGame.setPhasePressure(phaseProgress);

			// Curva emotiva del glitch:
			// cresce lentamente all'inizio e accelera verso la fine.
			const rampProgress = Math.pow(phaseProgress, this.config.rampExponent);

			// L'intensità parte dal valore minimo della fase
			// e arriva gradualmente a 1 man mano che si esaurisce il tempo.
			this.intensity = phase.intensityStart + (1 - phase.intensityStart) * rampProgress;	

			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const safeScaleX = (vw + phase.maxShakePx * 2) / vw;
			const safeScaleY = (vh + phase.maxShakePx * 2) / vh;
			const safeScale = Math.max(safeScaleX, safeScaleY);
			const safeScaleProgressive = 1 + (safeScale - 1) * rampProgress;

			const emotionalZoom =
				phase.baseZoomExtra * this.intensity +
				phase.rageZoomExtra * Math.pow(this.intensity, 2);

			const totalScale = safeScaleProgressive + emotionalZoom;

			let shakeStrength =
				phase.maxShakePx *
				(0.15 * this.intensity + 0.85 * Math.pow(this.intensity, 2));

			shakeStrength *= rampProgress;

			if (Math.random() < phase.spikeChance) {
				shakeStrength *= phase.spikeMultiplier;
			}

			const shakeX = (Math.random() * 2 - 1) * shakeStrength;
			const shakeY = (Math.random() * 2 - 1) * shakeStrength;

			const rotate =
				(Math.random() * 2 - 1) *
				this.config.rotationMaxDeg *
				Math.pow(this.intensity, 1.2);

			const stretchX =
				1 + this.config.stretchMax * this.intensity * (0.6 + Math.random() * 0.4);
			const stretchY =
				1 + this.config.squeezeMax * this.intensity * (0.6 + Math.random() * 0.4);

			const border = document.getElementById("rage-border");
			if (border) {
				const borderIntensity =
					0.25 * this.intensity + 0.75 * Math.pow(this.intensity, 2);
				border.style.opacity = borderIntensity;
			}

			const glitchTransform =
				`translate(${shakeX}px, ${shakeY}px) ` +
				`rotate(${rotate}deg) ` +
				`scale(${totalScale * stretchX}, ${totalScale * stretchY})`;

			this.applySceneTransform(glitchTransform);

			const nextDelay = phase.baseDelay - this.intensity * phase.delayRamp;
			this.timer = setTimeout(loop, Math.max(phase.minDelay, nextDelay));
		};

		clearTimeout(this.timer);
		loop();
	},

	endPhaseVisuals() {
		this.phaseResolved = true;
		clearTimeout(this.timer);
		this.timer = null;
		WordsGame.clearPhasePressure();
	},

	async playFirstPhaseFailFeedback() {
		// Primo step: shake percepibile, per comunicare il fallimento.
		WordsGame.shakeVisibleWords();
		await this.wait(520);

		// Secondo step: invece di sparire di colpo, le parole si dissolvono.
		await WordsGame.fadeOutVisibleWords(280);

		// Piccola pausa su schermo libero per far "sedimentare" il fallimento.
		await this.wait(260);
	},	
	
	async playRestartFadeOut() {
		// Partiamo esplicitamente da nero pieno.
		// Il rosso è ancora presente sotto, ma invisibile perché il nero lo copre.
		this.renderGameOverOverlay(1, 1);

		// Piccola pausa tecnica per evitare micro-flash tra i frame.
		await this.wait(100);

		// Dissolviamo contemporaneamente nero e rosso fino a tornare
		// alla scena completamente pulita, PRIMA del restart del minigioco.
		await this.animate(650, (t) => {
			const progress = Math.min(1, Math.max(0, t));
			const redAmount = 1 - progress;
			const blackAmount = 1 - progress;

			this.renderGameOverOverlay(redAmount, blackAmount);
		});

		// Pulizia finale dell'overlay.
		this.hideGameOverOverlay();
	},
	
	resetToFirstPhase() {
		this.endPhaseVisuals();
		this.currentPhaseIndex = 0;
		this.intensity = 0;
		WordsGame.reset();
	},

	//Metodo utility utile al cooldown, calcola le effettive dimensioni iniziali della scena 
	// getWrapperNeutralScale(){
	// 	const overscan = 64;	//valore in px della proprietà "inset" del wrapper nel css
	// 	const scaleX = window.innerWidth / (window.innerWidth + overscan * 2);
	// 	const scaleY = window.innerHeight / (window.innerHeight + overscan * 2);

	// 	return {
	// 		x: scaleX,
	// 		y: scaleY
	// 	};
	// },

	//Stessa animazione, ma a specchio e molto più brusca. Evito l'effetto "taglio netto".
	cooldown(duration = 700, targetIntensity = 0, restoreAtEnd = false) {
		if (!this.shakeWrapper?.isConnected) {
			if (!this.prepareShakeWrapper()) {
				return Promise.resolve();
			}
		}

		const border = document.getElementById("rage-border");

		// Salviamo l'intensità iniziale del rientro:
		// da qui partiremo per tornare gradualmente a zero.
		const startingIntensity = this.intensity;

		// Se siamo già praticamente al target, impostiamo direttamente
		// lo stato finale coerente e chiudiamo.
		if (Math.abs(startingIntensity - targetIntensity) <= 0.0001) {
			this.intensity = targetIntensity;

			const finalZoom =
				this.config.baseZoomExtra * targetIntensity +
				this.config.rageZoomExtra * Math.pow(targetIntensity, 2);

			const finalScale = 1 + finalZoom;
			const finalStretchX = 1 + this.config.stretchMax * 0.35 * targetIntensity;
			const finalStretchY = 1 + this.config.squeezeMax * 0.35 * targetIntensity;

			const finalTransform =
				`translate(0px, 0px) rotate(0deg) ` +
				`scale(${finalScale * finalStretchX}, ${finalScale * finalStretchY})`;

			this.applySceneTransform(finalTransform);

			if (border) {
				border.style.opacity = `${targetIntensity * 0.45}`;
			}

			if (restoreAtEnd) {
				this.restoreSceneTransforms();
			}

			return Promise.resolve();
		}

		const startTime = performance.now();

		return new Promise((resolve) => {
			const loop = () => {
				const now = performance.now();
				const t = Math.min(1, (now - startTime) / duration);

				// Ease-out morbido:
				// parte più deciso e rallenta bene verso la fine.
				const eased = 1 - Math.pow(1 - t, 2.4);

				// L'intensità scende gradualmente fino a al targetIntensity scelto (Default = 0).
				const currentIntensity = startingIntensity + (targetIntensity - startingIntensity) * eased;

				// Riduciamo molto lo shake durante il cooldown:
				// il rientro deve sembrare un rilascio di tensione,
				// non una prosecuzione dell'esplosione emotiva.
				const shakeStrength =
					this.config.maxShakePx *
					(0.04 * currentIntensity + 0.18 * Math.pow(currentIntensity, 2));

				const shakeX = (Math.random() * 2 - 1) * shakeStrength;
				const shakeY = (Math.random() * 2 - 1) * shakeStrength;

				const rotate =
					(Math.random() * 2 - 1) *
					this.config.rotationMaxDeg *
					0.22 *
					currentIntensity;

				const stretchX = 1 + this.config.stretchMax * 0.35 * currentIntensity;
				const stretchY = 1 + this.config.squeezeMax * 0.35 * currentIntensity;

				const emotionalZoom =
					this.config.baseZoomExtra * currentIntensity +
					this.config.rageZoomExtra * Math.pow(currentIntensity, 2);

				let totalScaleX = 1 + emotionalZoom;
				let totalScaleY = 1 + emotionalZoom;

				// if (restoreAtEnd) {
				// 	const neutralScale = this.getWrapperNeutralScale();
				// 	const neutralProgress = eased;

				// 	totalScaleX += (neutralScale.x - 1) * neutralProgress;
				// 	totalScaleY += (neutralScale.y - 1) * neutralProgress;
				// }

				if (border) {
					border.style.opacity = `${currentIntensity * 0.45}`;
				}

				const glitchTransform =
					`translate(${shakeX}px, ${shakeY}px) ` +
					`rotate(${rotate}deg) ` +
					`scale(${totalScaleX * stretchX}, ${totalScaleY * stretchY})`;

				this.applySceneTransform(glitchTransform);

				if (t < 1) {
					requestAnimationFrame(loop);
				} else {
					const finalZoom =
						this.config.baseZoomExtra * targetIntensity +
						this.config.rageZoomExtra * Math.pow(targetIntensity, 2);

					const finalScale = 1 + finalZoom;
					const finalStretchX = 1 + this.config.stretchMax * 0.35 * targetIntensity;
					const finalStretchY = 1 + this.config.squeezeMax * 0.35 * targetIntensity;

					let finalScaleX = finalScale * finalStretchX;
					let finalScaleY = finalScale * finalStretchY;

					const finalTransform =
						`translate(0px, 0px) rotate(0deg) ` +
						`scale(${finalScaleX}, ${finalScaleY})`;
					
					this.intensity = targetIntensity;

					if (restoreAtEnd) {
						this.restoreSceneTransforms();
					} else {
						this.applySceneTransform(finalTransform);
					}

					if (border && targetIntensity === 0) {
						border.style.opacity = "0";
					}

					resolve();
				}
			};

			requestAnimationFrame(loop);
		});
	},

	ensureGameOverOverlay() {
		if (this.gameOverOverlay?.isConnected) return this.gameOverOverlay;

		let overlay = document.getElementById("glitch-game-over");
		if (!overlay) {
			overlay = document.createElement("div");
			overlay.id = "glitch-game-over";
			overlay.className = "glitch-game-over";
			document.body.appendChild(overlay);
		}

		this.gameOverOverlay = overlay;
		return overlay;
	},

	hideGameOverOverlay() {
		const overlay = this.ensureGameOverOverlay();
		overlay.classList.remove("visible");
		overlay.style.opacity = "0";
		overlay.style.background = "transparent";
	},

	renderGameOverOverlay(redProgress, blackProgress) {
		const overlay = this.ensureGameOverOverlay();
		const red = Math.max(0, Math.min(1, redProgress));
		const black = Math.max(0, Math.min(1, blackProgress));

		const innerGlow = 0.08 + red * 0.42;
		const midGlow = 0.16 + red * 0.46;
		const edgeGlow = 0.32 + red * 0.58;
		const globalRedWash = red * 0.34;

		overlay.classList.add("visible");
		overlay.style.opacity = "1";
		overlay.style.background = [
			`linear-gradient(rgba(0, 0, 0, ${black}), rgba(0, 0, 0, ${black}))`,
			`radial-gradient(circle at center,
				rgba(255, 40, 40, ${innerGlow}) 0%,
				rgba(210, 0, 0, ${midGlow}) 45%,
				rgba(120, 0, 0, ${edgeGlow}) 100%)`,
			`linear-gradient(rgba(120, 0, 0, ${globalRedWash}), rgba(120, 0, 0, ${globalRedWash}))`
		].join(", ");
	},

	animate(duration, renderFrame) {
		return new Promise((resolve) => {
			const start = performance.now();

			const tick = (now) => {
				const t = Math.min(1, (now - start) / duration);
				renderFrame(t);

				if (t < 1) {
					requestAnimationFrame(tick);
				} else {
					resolve();
				}
			};

			requestAnimationFrame(tick);
		});
	},

	wait(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},

	async playGameOverSequence() {

		await this.animate(850, (t) => {
			const eased = 1 - Math.pow(1 - t, 2.2);
			this.renderGameOverOverlay(eased, 0);
		});

		await this.animate(520, (t) => {
			const eased = Math.pow(t, 1.2);
			this.renderGameOverOverlay(1, eased);
		});

		this.renderGameOverOverlay(1, 1);

		// Pausa nera finale per dare respiro e rendere il reset più cinematografico
		await this.wait(1400);
	},

	async stop(completed = false) {
		this.active = false;
		this.phaseResolved = true;
		clearTimeout(this.timer);
		this.timer = null;
		WordsGame.reset();

		if (!completed) {
			const store = monogatari.storage();
			store.glitchGameCompleted = false;
			store.glitchGamePhase = 1;
		}

		await this.cooldown(500, 0, true);
	}
};

const WordsGame = {
	element: null,
	store: null,
	activeWords: 0,
	runId: 0,
	spawnTimer: null,
	phaseTimer: null,
	resolver: null,
	isActive: false,

	config: {
		spawnDelay: 700,
		screenPadding: 20,
		maxRotation: 12,
		swipeThreshold: 70,
		swipeEscape: 180,
		jitterX: 28,
		jitterY: 36
	},

	init() {
		this.element = document.getElementById("word-game-overlay");
		this.store = monogatari.storage();
	},

	start(phase) {
		if (!this.element) this.init();
		if (!this.element || !this.store) return Promise.resolve({success: false, reason: "missing-overlay"});

		this.reset();
		this.runId += 1;	//Id fase, mi salvo lo stato quando la fase è completata per non ripeterla erroneamente
		const currentRunId = this.runId;
		this.isActive = true;

		this.element.classList.add("visible");
		this.element.classList.remove("locked");
		document.body.style.overflow = "hidden";

		return new Promise((resolve) => {
			this.resolver = resolve;

			this.phaseTimer = setTimeout(() => {
				if (!this.isCurrentRun(currentRunId)) return;
				this.expireRun(currentRunId);
			}, phase.timeLimit);

			this.showWords(phase, currentRunId);
		});
	},

	clear() {
		if (!this.element) return;
		this.element.innerHTML = "";
		this.activeWords = 0;
	},

	end() {
		document.body.style.overflow = "";
		this.activeWords = 0;

		if (this.element) {
			this.element.classList.remove("visible", "locked");
			this.element.innerHTML = "";
		}
	},

	reset() {
		this.clearPhasePressure();
		this.abortCurrentRun({success: false, reason: "reset"});
	},

	abortCurrentRun(result = { success: false, reason: "aborted"}) {
		const resolve = this.resolver;
		this.resolver = null;
		this.isActive = false;
		clearTimeout(this.spawnTimer);
		clearTimeout(this.phaseTimer);
		this.spawnTimer = null;
		this.phaseTimer = null;
		this.end();

		if (typeof resolve === "function") {
			resolve(result);
		}
	},

	resolveRun(success, runId) {
		if (!this.isCurrentRun(runId)) return;
		this.clearPhasePressure();
		this.abortCurrentRun({success, reason: success ? "cleared" : "failed"});
	},

	expireRun(runId){
		if (!this.isCurrentRun(runId)) return;

		const resolve = this.resolver;
		this.resolver = null;
		this.isActive = false;
		clearTimeout(this.spawnTimer);
		clearTimeout(this.phaseTimer);
		this.spawnTimer = null;
		this.phaseTimer = null;

		if (this.element) {
			this.element.classList.add("visible", "locked");
		}

		if (typeof resolve === "function") {
			resolve({ success: false, reason: "timeout" });
		}
	},

	async showWords(phase, runId) {
		const words = this.store.frasiRabbia || [];
		if (!words.length) {
			this.resolveRun(true, runId);
			return;
		}

		const spawnPoints = this.getSpawnPoints();
		this.shuffleArray(spawnPoints);
		this.activeWords = words.length;

		for (let i = 0; i < words.length; i++) {
			if (!this.isCurrentRun(runId)) return;

			const wordObj = this.createWordElement(words[i]);
			this.element.appendChild(wordObj.wrapper);

			this.freezeWordLayout(wordObj.textNode, wordObj.label, wordObj.wrapper);

			const point = spawnPoints[i % spawnPoints.length];
			this.placeWord(wordObj.wrapper, point);
			this.attachTouchSwipe(wordObj.wrapper, runId);

			if (i < words.length - 1) {
				await this.wait(phase.spawnDelay, runId);
			}
		}
	},

	createWordElement(text) {
		const wrapper = document.createElement("div");
		wrapper.className = "word-item";

		const label = document.createElement("div");
		label.className = "word-label";
		label.style.setProperty(
			"--word-rotation",
			`${this.randomBetween(-this.config.maxRotation, this.config.maxRotation)}deg`
		);

		const textNode = document.createElement("span");
		textNode.className = "word-text";
		textNode.textContent = text;

		label.appendChild(textNode);
		wrapper.appendChild(label);

		return { wrapper, label, textNode };
	},

	getSpawnPoints() {
		const w = window.innerWidth;
		const h = window.innerHeight;

		return [
			{ x: w * 0.22, y: h * 0.18 },
			{ x: w * 0.74, y: h * 0.16 },
			{ x: w * 0.50, y: h * 0.30 },
			{ x: w * 0.25, y: h * 0.46 },
			{ x: w * 0.77, y: h * 0.48 },
			{ x: w * 0.34, y: h * 0.68 },
			{ x: w * 0.70, y: h * 0.78 },
			{ x: w * 0.50, y: h * 0.84 }
		];
	},

	freezeWordLayout(textNode, label, wrapper) {
		wrapper.style.visibility = "hidden";
		wrapper.style.left = "0px";
		wrapper.style.top = "0px";

		const previousAnimation = label.style.animation;
		const previousTransform = label.style.transform;

		label.style.animation = "none";
		label.style.transform = "none";

		const textWidth = Math.ceil(textNode.offsetWidth);
		const textHeight = Math.ceil(textNode.offsetHeight);

		textNode.style.display = "inline-block";
		textNode.style.width = `${textWidth}px`;
		textNode.style.maxWidth = `${textWidth}px`;

		label.style.width = `${textWidth}px`;
		label.style.maxWidth = `${textWidth}px`;

		wrapper.style.width = `${textWidth}px`;
		wrapper.style.height = `${textHeight}px`;

		label.style.animation = previousAnimation;
		label.style.transform = previousTransform;
	},

	placeWord(wrapper, point) {
		wrapper.style.visibility = "hidden";
		wrapper.style.left = "0px";
		wrapper.style.top = "0px";

		const rect = wrapper.getBoundingClientRect();
		const wordWidth = rect.width;
		const wordHeight = rect.height;

		const jitterX = this.randomBetween(-this.config.jitterX, this.config.jitterX);
		const jitterY = this.randomBetween(-this.config.jitterY, this.config.jitterY);

		const desiredLeft = point.x - (wordWidth / 2) + jitterX;
		const desiredTop = point.y - (wordHeight / 2) + jitterY;

		const safeLeft = this.clamp(
			desiredLeft,
			this.config.screenPadding,
			window.innerWidth - this.config.screenPadding - wordWidth
		);

		const safeTop = this.clamp(
			desiredTop,
			this.config.screenPadding,
			window.innerHeight - this.config.screenPadding - wordHeight
		);

		wrapper.style.left = `${safeLeft}px`;
		wrapper.style.top = `${safeTop}px`;
		wrapper.style.visibility = "visible";
	},

	shakeVisibleWords() {
		if (!this.element) return;

		const words = this.element.querySelectorAll(".word-item");
		words.forEach((word) => word.classList.add("game-over-shake"));
	},

	setPhasePressure(progress) {
		// progress va da 0 a 1 e rappresenta quanto siamo vicini
		// alla fine della fase.
		if (!this.element) return;

		this.element.style.setProperty("--phase-pressure", `${progress}`);
	},

	clearPhasePressure() {
		if (!this.element) return;
		this.element.style.setProperty("--phase-pressure", "0");
	},

	fadeOutVisibleWords(duration = 260) {
		// Dissolve tutte le parole correnti senza chiudere immediatamente
		// l'intero overlay. Serve per dare una fine più elegante al fallimento.
		if (!this.element) return Promise.resolve();

		const words = Array.from(this.element.querySelectorAll(".word-item"));
		if (!words.length) return Promise.resolve();

		return new Promise((resolve) => {
			words.forEach((word) => {
				word.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
				word.style.opacity = "0";
				word.style.transform = "scale(0.94) translateY(10px)";
			});

			setTimeout(() => {
				this.clearVisibleWords();
				resolve();
			}, duration + 20);
		});
	},

	attachTouchSwipe(wrapper, runId) {
		let dragging = false;
		let startTouchX = 0;
		let startTouchY = 0;
		let offsetX = 0;
		let offsetY = 0;
		let currentLeft = 0;
		let currentTop = 0;
		let deltaX = 0;
		let deltaY = 0;

		wrapper.addEventListener("touchstart", (event) => {
			if (!this.isCurrentRun(runId)) return;

			const touch = event.touches[0];
			if (!touch) return;

			event.preventDefault();

			const rect = wrapper.getBoundingClientRect();

			dragging = true;
			wrapper.classList.add("dragging");
			wrapper.style.transition = "";

			startTouchX = touch.clientX;
			startTouchY = touch.clientY;
			currentLeft = parseFloat(wrapper.style.left) || 0;
			currentTop = parseFloat(wrapper.style.top) || 0;
			offsetX = touch.clientX - rect.left;
			offsetY = touch.clientY - rect.top;
			deltaX = 0;
			deltaY = 0;
		}, { passive: false });

		wrapper.addEventListener("touchmove", (event) => {
			if (!dragging || !this.isCurrentRun(runId)) return;

			const touch = event.touches[0];
			if (!touch) return;

			event.preventDefault();

			deltaX = touch.clientX - startTouchX;
			deltaY = touch.clientY - startTouchY;

			const newLeft = touch.clientX - offsetX;
			const newTop = touch.clientY - offsetY;

			wrapper.style.left = `${newLeft}px`;
			wrapper.style.top = `${newTop}px`;
		}, { passive: false });

		const endDrag = () => {
			if (!dragging || !this.isCurrentRun(runId)) return;

			dragging = false;
			wrapper.classList.remove("dragging");

			const distance = Math.hypot(deltaX, deltaY);

			if (distance >= this.config.swipeThreshold) {
				const norm = distance || 1;
				const dirX = deltaX / norm;
				const dirY = deltaY / norm;

				const finalLeft = (parseFloat(wrapper.style.left) || 0) + dirX * this.config.swipeEscape;
				const finalTop = (parseFloat(wrapper.style.top) || 0) + dirY * this.config.swipeEscape;

				wrapper.style.transition = "left 220ms ease, top 220ms ease, opacity 220ms ease";
				wrapper.style.left = `${finalLeft}px`;
				wrapper.style.top = `${finalTop}px`;
				wrapper.style.opacity = "0";

				setTimeout(() => {
					if (!this.isCurrentRun(runId)) return;

					wrapper.remove();
					this.activeWords -= 1;

					if (this.activeWords <= 0) {
						this.resolveRun(true, runId);
					}
				}, 230);
			} else {
				wrapper.style.transition = "left 180ms ease, top 180ms ease";
				wrapper.style.left = `${currentLeft}px`;
				wrapper.style.top = `${currentTop}px`;

				setTimeout(() => {
					if (this.isCurrentRun(runId)) {
						wrapper.style.transition = "";
					}
				}, 200);
			}
		};

		wrapper.addEventListener("touchend", endDrag, { passive: true });
		wrapper.addEventListener("touchcancel", endDrag, { passive: true });
	},

	clearVisibleWords() {
		// Rimuove immediatamente tutte le parole ancora presenti a schermo.
		// Non chiude il minigioco intero: pulisce solo il contenuto visivo.
		if (!this.element) return;

		this.element.innerHTML = "";
		this.activeWords = 0;
	},

	wait(ms, runId) {
		return new Promise((resolve) => {
			this.spawnTimer = setTimeout(() => {
				if (!this.isCurrentRun(runId)) return;
				resolve();
			}, ms);
		});
	},

	isCurrentRun(runId) {
		return this.isActive && this.runId === runId;
	},

	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	},

	randomBetween(min, max) {
		return min + Math.random() * (max - min);
	},

	clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

};

//TODO - Adjustments tempi minigioco
//	   - Creazione di un'animazione di "game over" quando si resetta alla prima fase (capire se voluto)
//	   - Mini tutorial per far capire all'utente che deve swipare le parole via 
//	   - Fare documentazione delle procedure per migliorare manutenibilità
// 	   - Se necessario, vedere se far capire all'utente il passaggio da una fase all'altra / utilizzare frasi diverse per le varie fasi

/*
FUNZIONI CUSTOM
*/ 
const SCENE_IMAGES = {
	'negazione': [
		{ id: 'cornice', src: 'assets/images/cornice.png'},
		{ id: 'pianta_2', src: 'assets/images/pianta_2.png'}
	],
	'rabbia': [
		{ id: 'cornice_rotta', src: 'assets/images/cornice_rotta.png'},
		{ id: 'pianta_1', src: 'assets/images/pianta_1.png'},
		{ id: 'vestiti', src: 'assets/images/vestiti.png'}
	],
	'contrattazione': [
		{ id: 'cornice_rotta', src: 'assets/images/cornice_rotta.png', onClick: 'assets/images/cornice.png'},
		{ id: 'pianta_1', src: 'assets/images/pianta_1.png', onClick: 'assets/images/pianta_2.png'},
		{ id: 'vestiti', src: 'assets/images/vestiti.png', onClick: 'assets/images/blank.png'}
	],
	'depressione': [
		{ id: 'cornice', src: 'assets/images/cornice.png'},
		{ id: 'pianta_2', src: 'assets/images/pianta_2.png'},
		{ id: 'uomo', src: 'assets/images/uomo.png'}
	],
	'accettazione': [
		{ id: 'cornice', src: 'assets/images/cornice.png'},
		{ id: 'pianta_3', src: 'assets/images/pianta_3.png'}
	]
}
const SceneUtility = {
	clickedItems: false,
	async loadSky(typeOfSky){
		function preloadImage(src){
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = resolve;
				img.onerror = reject;
				img.src = src;
			});
		}
		
		const sky = document.getElementById("sky");
		const overlay = document.getElementById("sceneFadeOverlay");

		//Imposto l'immagine di background del div
		const imageSrc = `assets/scenes/cielo_${typeOfSky}.png`;

		if(typeOfSky === 'nuvolo'){
			const rain = document.createElement('img');

			rain.src = `assets/images/rain.gif`;
			rain.id = 'rain';
			rain.classList.add('rain');

			sky.appendChild(rain);

			console.log(sky);
		}

		overlay.classList.add("covering");

		await preloadImage(imageSrc);

		sky.style.display = "block";
		sky.style.backgroundImage= `url("${imageSrc}")`;

		this.toggleBackground();
	},

	toggleBackground(){
		document.body.classList.add("composite-sky-scene");
	},
	enableBackground(){
		document.body.classList.remove("composite-sky-scene");
	},

	async loadDetails(typeOfItems) {
		// Carica o crea il wrapper
		let wrapper = document.getElementById('details-wrapper');
		
		if (!wrapper) {
			wrapper = document.createElement('div');
			wrapper.id = 'details-wrapper';
			wrapper.className = 'details-wrapper';

			// Aggiungo il wrapper al gioco 
			document.body.appendChild(wrapper);
		}
		
		// Pulisci il contenuto precedente
		wrapper.innerHTML = '';
		
		// Prendi le immagini dalla scena
		const images = SCENE_IMAGES[typeOfItems];
		
		if (!images) {
			console.warn(`Nessuna immagine per la scena: ${typeOfItems}`);
			return;
		}
		
		if(typeOfItems === "contrattazione"){
			// Aggiungiamo un eventListenr unico che gestisce i vari layer di immagini
			wrapper.addEventListener('click', (e) => {
				e.stopPropagation();

				// Prendiamo tutte le immagini clickabili
				const clickableImages = wrapper.querySelectorAll('.clickable-object');
				console.log(clickableImages);
				
				// Controlla le immaggin dalla superiore all'inferiore nel DOM
				const imagesArray = Array.from(clickableImages).reverse();
				
				for (const img of imagesArray) {
					if (isClickOnVisiblePixel(img, e)) {
						const imgId = img.id;
						const imgData = images.find(i => i.id === imgId);
						
						if (imgData && imgData.onClick) {
							img.src = imgData.onClick;
							img.classList.remove('clickable-object', 'highlight');
							img.style.pointerEvents = 'none';
						}

						if(!clickableImages) this.clickedItems = true;
						break; // Stop dopo il primo match
					}
				}
			});

		}
		
		function loadImage(imgData, wrapper){
			return new Promise((resolve) => {
				const img = document.createElement('img');
				img.id = imgData.id;
				img.src = imgData.src;
				img.className = 'wrapper-item';

				if(imgData.onClick){
					img.classList.add('clickable-object', 'highlight');
					// img.style.pointerEvents = 'auto'; //Override pointerEvents: none; del wrapper
				
					// img.addEventListener('click', (e) => {
					// 	e.stopPropagation();
					// 	// Si trigghera solamente se il click è fatto su pixel senza trasparenza
					// 	if (isClickOnVisiblePixel(img, e)) {						
					// 		img.src = imgData.onClick;
							
					// 		img.classList.remove('clickable-object', 'highlight');
					// 		img.style.pointerEvents = 'none';
					// 	}					
					// })
				}
					
				
				img.onload = () => {
					wrapper.appendChild(img);
					console.log(img);
					resolve();
				};
				
				img.onerror = () => {
					console.error(`Failed to load: ${imgData.src}`);
					resolve(); // Resolve comunque per far caricare le altre immagini
				};
			});
		}

		function isClickOnVisiblePixel(imgElement, event) {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			
			// Use natural dimensions for accurate pixel sampling
			canvas.width = imgElement.naturalWidth;
			canvas.height = imgElement.naturalHeight;
			
			ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
			
			const rect = imgElement.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			
			// Calculate position relative to natural image size
			const scaleX = imgElement.naturalWidth / rect.width;
			const scaleY = imgElement.naturalHeight / rect.height;
			const pixelX = Math.floor(x * scaleX);
			const pixelY = Math.floor(y * scaleY);

			try {
				const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
				console.log('Alpha value:', pixelData[3]);
				return pixelData[3] > 0;
			} catch (error) {
				console.error('Error getting pixel data:', error);
				return false;
			}
		}

		// Carica le immagini
		for (const imgData of images) {
			await loadImage(imgData, wrapper);
		}

		console.log(`Loaded ${images.length} images for ${typeOfItems}`);
	},


	revealPreparedScene() {
		const overlay = document.getElementById("sceneFadeOverlay");

		/*
		Aspetto 2 volte il frame:
		Stato iniziale: Opacity 1, quindi tutto nero
		Stato intermedio: rimuovo l'overlay e do il tempo al browser di far partire l'animazione
		Stato finale: Opacity 0, quindi trasparente

		Tecnica usata spesso per animazioni di questo tipo
		*/ 
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				overlay.classList.remove("covering");
			})
		})
	},

	async loadScene(typeOfScene){
		switch(typeOfScene){
			case "negazione":
				await this.loadSky("giorno_2");
				break;
			case "rabbia":
				await this.loadSky("nuvolo");
				break;
			case "contrattazione":
				await this.loadSky("giorno_2")
				break;
			case "depressione":
				await this.loadSky("nuvolo");
				break;
			case "accettazione":
				await this.loadSky("giorno_1");
				break;
		}
		await this.loadDetails(typeOfScene);
	},

	async endClickedItems() {
    	return new Promise((resolve) => {
			const checkCondition = () => {
				const wrapper = document.getElementById('details-wrapper');
				if (!wrapper) {
					resolve();
					return;
				}
				
				// Check if there are any remaining clickable objects
				const clickableObjects = wrapper.querySelectorAll('.clickable-object');
				
				if (clickableObjects.length === 0) {
					// All objects have been clicked and removed
					resolve();
				} else {
					// Still objects remaining, check again in a bit
					setTimeout(checkCondition, 100);
				}
			};
			
			checkCondition();
		});
	},

	emptyScene(){
		let wrapper = document.getElementById('details-wrapper');
		let rain = document.getElementById('rain');

		if(wrapper)
			document.body.removeChild(wrapper);

		if(rain)
			document.body.removeChild(rain);		
	}



}	


const PanicBreath = {
	state: "idle",	//idle | buildup | plateau | release
	rate: 1,	//1 = normale, 3 = panico
	volume: 0.2,
	inAudio: null,
	outAudio: null,
	timer: null,
	phase: "in",	//in | out
	startTime: 0,

	init(){
		if(!this.inAudio){
			this.inAudio = new Audio("assets/sounds/breath_in.mp3");
			this.outAudio = new Audio("assets/sounds/breath_out.mp3");
		}
	},

	start(){
		if(this.state !== "idle") return;

		this.init();
		this.state = "buildup";
		this.rate = 1;
		this.volume = 0.2;
		this.phase = "in";
		this.startTime = performance.now();

		this.loop();
	},

	loop(){
		const now = performance.now();
		const elapsed = (now - this.startTime) / 1000;

		switch(this.state){
			case "idle":
				return;
			
			case "buildup":
				const t = Math.min(elapsed / 8, 1);	//normalizzato 0 -> 1
				
				// const smooth = t*t*t*(t*(6*t - 15) + 10);	//Quintic smoothstep
				const smooth = 1 / (1+Math.exp(-6 * (t - 0.5)));
				// this.volume = 0.2 + (1 - Math.pow(2, -2 * t)) *0.8;	//Easing esponenziale volume	
				// this.rate = 0.8 + t * 2; //rate cresce più velocemente da 1 a 3 
				
				this.volume = 0.2 + smooth * 0.8;
				this.rate = 0.8 + smooth * 2;

				if(t >= 1)
					this.state = "plateau";
				break;

			case "plateau":
				this.rate = 2.5;
				this.volume = 1;
				break;

			case "release":
				this.rate = Math.max(1, this.rate - 0.12);
				this.volume = Math.max(0.2, this.volume - 0.05);

				if(this.rate <= 1.05 && this.volume <= 0.25){
					this.stop();
					return;
				}
		}

		// Applica volume
        this.inAudio.volume = this.volume;
        this.outAudio.volume = this.volume;

        // Durate base
        const baseIn = 0.7;
        const baseOut = 0.8;

		const MIN_PLATEAU_PAUSE = 0.12;

        // Pause dipendono dal rate
        const pauseBetween = 0.15 / this.rate + MIN_PLATEAU_PAUSE;
        const pauseCycle = 0.4 / this.rate + MIN_PLATEAU_PAUSE;

        let delay = 0;

        if (this.phase === "in") {
            this.inAudio.currentTime = 0;
            this.inAudio.play();
            delay = (baseIn / this.rate + pauseBetween) * 1000;
            this.phase = "out";
        } else {
            this.outAudio.currentTime = 0;
            this.outAudio.play();
            delay = (baseOut / this.rate + pauseCycle) * 1000;
            this.phase = "in";
        }

        this.timer = setTimeout(() => this.loop(), delay);
	},

	release(){
		this.state = "release";
	},

	stop(){
		this.state = "idle";
		clearTimeout(this.timer);
		this.inAudio.pause();
		this.outAudio.pause();
	}
}

const BlinkOverlay = {
	speed: 300,
	overlay: null,
	isBlinkning: false,

	init(){
		this.overlay = document.getElementById('blink-overlay');

		if(!this.overlay){
			this.overlay = document.createElement('div');
			this.overlay.id = 'blink-overlay';
			this.overlay.className = 'blink-overlay';
			this.overlay.innerHTML = '<div class="eyelid top"></div><div class="eyelid bottom"></div>';
			document.body.appendChild(this.overlay);
		}

		this.overlay.classList.add('blink-overlay');
		this.setSpeed(this.speed);

		return this.overlay;
	},

	getOverlay(){
		return this.overlay || this.init();
	},

	setSpeed(ms){
		this.speed = Number(ms) || 300;
		this.getOverlay().style.setProperty('--speed', `${this.speed}ms`);
	},

	wait(ms){return new Promise(resolve => setTimeout(resolve, ms));},

	async blink(speed = this.speed) {
		if (this.isBlinking) {
			return;
		}

		this.isBlinking = true;

		try {
			this.setSpeed(speed);

			const overlay = this.getOverlay();

			overlay.classList.add('closed');
			await this.wait(this.speed);

			overlay.classList.remove('closed');
			await this.wait(this.speed * 1.15);
		} finally {
			this.isBlinking = false;
		}
	},


	async doubleBlink(speed = this.speed) {
		await this.blink(speed);
		await this.wait(this.speed * 0.35);
		await this.blink(speed * 0.85);
	}
}

const AcceleratingClock = {
	stopClock: null,

	startAcceleratingClock(elementId) {
        const display = document.getElementById(elementId);
		const now = new Date();

		let hours = now.getHours();
		let minutes = now.getMinutes();
		let seconds = now.getSeconds();
		let delay = 800;
		let timeoutId;
		let tickCount = 0;
		
		console.log(hours, minutes, seconds);

		function updateClock() {
			const timeString = [
				hours.toString().padStart(2, '0'),
				minutes.toString().padStart(2, '0')
			].join(':');
			
			display.textContent = timeString;
			
			tickCount++;
			
			//L'aggiunta dei minuti è esponenziale
			let minutesToAdd = Math.pow(2, tickCount);

			minutes += minutesToAdd;

			while (minutes >= 60) {
				minutes -= 60;
				hours++;
			}
			while (hours >= 24) {
				hours -= 24;
			}
			
			delay = Math.max(30, delay * 0.85);
			timeoutId = setTimeout(updateClock, delay);
		}
		
		updateClock();
		
		return function stop() {
			clearTimeout(timeoutId);
		};
	}
}

/*OGGETTI CLICKABILI*/
function showClickableObjects(){
	const container = document.createElement("div");
	container.id = "clickable-objects";
	container.style.position = "absolute";
	container.style.top = "0";
	container.style.left = "0";
	container.style.width = "100%";
	container.style.height = "100%";
	container.style.pointerEvents = "none"; //gli oggetti stessi avranno pointerEvents

	const objects = [
		{ id: "obj1", img: "assets/images/placeholder.png", x:"70%", y:"60%", w:"80px"},
		{ id: "obj2", img: "assets/images/placeholder.png", x: "20%", y: "50%", w: "100px"}
	];

	objects.forEach(o => {
		const element = document.createElement("img");
		element.src = o.img;
		element.id = o.id;
		element.classList.add('clickable-object');
		element.style.position = "absolute";
		element.style.left = o.x;
		element.style.top = o.y;
		element.style.width = o.w;
		element.style.pointerEvents = "auto";
		element.addEventListener("click", (e) => {
			e.stopPropagation(); //NON TOGLIERE, necessario per non far mangiare il click dal global listener di monogatari
			monogatari.storage().lastClickedObject = o.id; //Mantengo in memoria l'ultimo oggetto clickato
			showDetail(o.id, o.img);
		});
		container.appendChild(element);
	});

	document.body.appendChild(container);
}

function hideClickableObjects(){
	document.getElementById("clickable-objects")?.remove();
}

function showDetail(objectId, imageSrc) {
	const store = monogatari.storage();
	NightOverlay.isFrozen = true;
	
	store.lastClickedObject = objectId;
	
	// Overlay blur
	const blur = document.createElement("div");
	blur.id = "detail-blur";
	blur.className = "detail-blur";

	// Immagine zoommata
	const zoom = document.createElement("img");
	zoom.id = "detail-zoom";
	zoom.className = "detail-zoom";
	zoom.src = imageSrc;

	// Descrizione
	const desc = document.createElement("div");
	desc.id = "detail-desc";
	desc.className ="detail-desc";
	desc.textContent = store.objectDescriptions[objectId];

	// Pulsante indietro
	const back = document.createElement("div");
	back.id = "detail-back";
	back.className = "detail-back";
	back.innerText = "Chiudi";
	back.onclick = () => hideDetail(objectId);

	document.body.appendChild(blur);
	document.body.appendChild(zoom);
	document.body.appendChild(back);
	document.body.appendChild(desc);
}

function hideDetail(objectId) {	
	NightOverlay.isFrozen = false;
	const store = monogatari.storage();

	if(!store.clickedObjects.includes(objectId)){
		store.clickedObjects.push(objectId);
	}

	document.getElementById("detail-blur")?.remove();
	document.getElementById("detail-zoom")?.remove();
	document.getElementById("detail-back")?.remove();
	document.getElementById("detail-desc")?.remove();

}

/*
DEBUG MENU
Toggle globale del menu di debug.
Mettere a false per disattivarlo completamente: non viene creato il DOM,
non vengono registrati eventi e non funziona la scorciatoia Ctrl/Cmd + Shift + D.
*/
const DEBUG_MENU_ENABLED = true;

const DebugMenu = {
	// Elemento radice che contiene sia il bottone "Debug" sia il pannello.
	root: null,

	// Pannello apribile con la lista delle scene raggiungibili.
	panel: null,

	// Riga di stato usata per mostrare label corrente, salti ed errori.
	status: null,

	// Bottone compatto visibile in alto a sinistra.
	toggleButton: null,

	// Chiave localStorage: ricorda se il pannello era aperto o chiuso.
	storageKey: 'cio-debug-menu-open',

	// Titolo dell'unico gruppo mostrato nel pannello.
	groupTitle: 'Scene',

	// Elenco dei label Monogatari disponibili nel menu.
	// Ogni stringa e' sia il testo mostrato nel bottone sia il label usato da jump.
	labels: [
		'Start',
		'Intermezzo_Respira',
		'Negazione_Cellulare',
		'Negazione_Rispondi',
		'Negazione_Ignora',
		'Secondo_Messaggio',
		'Rimani_A_Casa',
		'Esci_Casa',
		'Torcia',
		'Continua',
		'Rabbia',
		'GlitchRabbia',
		'ContinuaGlitch',
		'Contrattazione',
		'Depressione',
		'Test_telefono'
	],

	init() {
		// Se il toggle globale e' spento, il menu non viene inizializzato.
		if (!DEBUG_MENU_ENABLED) return;

		// Evita doppie inizializzazioni se Monogatari o Live Server ricaricano parti del DOM.
		if (this.root) return;

		// Costruisce il DOM del menu e poi collega click/scorciatoie.
		this.create();
		this.bindEvents();

		// Decide se partire aperto: query string, preferenza salvata o runtime locale.
		if (this.shouldOpenOnLoad()) {
			this.open();
		}
	},

	create() {
		// Contenitore principale: viene appeso al body e isolato dal layout del gioco.
		this.root = document.createElement('div');
		this.root.className = 'debug-menu';

		// Bottone sempre disponibile per aprire/chiudere il pannello.
		this.toggleButton = document.createElement('button');
		this.toggleButton.type = 'button';
		this.toggleButton.className = 'debug-menu-toggle';
		this.toggleButton.textContent = 'Debug';
		this.toggleButton.setAttribute('aria-expanded', 'false');

		// Pannello vero e proprio, nascosto finche' root non riceve la classe "open".
		this.panel = document.createElement('div');
		this.panel.className = 'debug-menu-panel';
		this.panel.setAttribute('aria-hidden', 'true');

		// Header del pannello: titolo + bottone di chiusura.
		const header = document.createElement('div');
		header.className = 'debug-menu-header';

		const title = document.createElement('strong');
		title.textContent = 'Salta scena';

		const close = document.createElement('button');
		close.type = 'button';
		close.className = 'debug-menu-close';
		close.textContent = 'x';
		close.setAttribute('aria-label', 'Chiudi debug');
		close.dataset.debugClose = 'true';

		header.appendChild(title);
		header.appendChild(close);

		// Stato testuale: aiuta a capire quale label e' attivo o se un salto fallisce.
		this.status = document.createElement('div');
		this.status.className = 'debug-menu-status';
		this.status.textContent = 'Label corrente: -';

		// Griglia che contiene sezioni e bottoni di salto.
		const grid = document.createElement('div');
		grid.className = 'debug-menu-grid';

		// Crea un solo titolo di gruppo per tutte le scene.
		const group = document.createElement('div');
		group.className = 'debug-menu-group';
		group.textContent = this.groupTitle;
		grid.appendChild(group);		// Trasforma ogni label in un bottone di salto.
		this.labels.forEach((label) => {
			// Bottone che memorizza nel dataset il label Monogatari di destinazione.
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'debug-menu-jump';
			button.dataset.debugLabel = label;

			// Testo visuale del bottone: coincide con il label tecnico.
			const buttonTitle = document.createElement('span');
			buttonTitle.textContent = label;

			button.appendChild(buttonTitle);
			grid.appendChild(button);
		});

		// Footer con azioni di manutenzione runtime.
		const footer = document.createElement('div');
		footer.className = 'debug-menu-footer';

		const reset = document.createElement('button');
		reset.type = 'button';
		reset.className = 'debug-menu-reset';
		reset.dataset.debugReset = 'true';
		reset.textContent = 'Reset stato runtime';

		footer.appendChild(reset);

		// Montaggio finale del pannello.
		this.panel.appendChild(header);
		this.panel.appendChild(this.status);
		this.panel.appendChild(grid);
		this.panel.appendChild(footer);

		// Montaggio finale del menu nel body.
		this.root.appendChild(this.toggleButton);
		this.root.appendChild(this.panel);
		document.body.appendChild(this.root);

		// Prima lettura del label corrente.
		this.refreshStatus();
	},

	bindEvents() {
		// Click sul bottone principale: apre o chiude il menu.
		this.toggleButton.addEventListener('click', () => this.toggle());

		// Event delegation: un solo listener gestisce chiusura, salti e reset.
		this.root.addEventListener('click', async (event) => {
			const closeButton = event.target.closest('[data-debug-close]');
			const jumpButton = event.target.closest('[data-debug-label]');
			const resetButton = event.target.closest('[data-debug-reset]');

			if (closeButton) {
				this.close();
				return;
			}

			if (jumpButton) {
				this.jumpTo(jumpButton.dataset.debugLabel);
				return;
			}

			if (resetButton) {
				await this.resetRuntimeState();
				this.setStatus('Stato runtime pulito');
			}
		});

		// Scorciatoia rapida: Ctrl + Shift + D su Windows/Linux, Cmd + Shift + D su macOS.
		document.addEventListener('keydown', (event) => {
			const key = (event.key || '').toLowerCase();
			const modifier = event.ctrlKey || event.metaKey;

			if (modifier && event.shiftKey && key === 'd') {
				event.preventDefault();
				this.toggle();
			}
		});
	},

	shouldOpenOnLoad() {
		// Query string manuale:
		// ?debug=1 forza apertura, ?debug=0 forza chiusura.
		const params = new URLSearchParams(window.location.search);
		const debugParam = params.get('debug');

		// Preferenza persistente salvata quando apri/chiudi il pannello.
		const storedOpenState = this.getStoredOpenState();

		if (debugParam === '0') return false;
		if (debugParam === '1') return true;
		if (storedOpenState === '0') return false;
		if (storedOpenState === '1') return true;

		// In sviluppo locale il menu parte aperto la prima volta.
		return this.isLocalRuntime();
	},

	isLocalRuntime() {
		// Live Server di solito usa localhost o 127.0.0.1.
		return window.location.protocol === 'file:' ||
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1' ||
			window.location.hostname === '';
	},

	open() {
		// La classe "open" attiva il pannello via CSS.
		this.root.classList.add('open');
		this.panel.setAttribute('aria-hidden', 'false');
		this.toggleButton.setAttribute('aria-expanded', 'true');

		// Ricorda che lo sviluppatore lo ha lasciato aperto.
		this.setStoredOpenState('1');
		this.refreshStatus();
	},

	close() {
		// Rimuove la classe "open" e aggiorna gli attributi aria.
		this.root.classList.remove('open');
		this.panel.setAttribute('aria-hidden', 'true');
		this.toggleButton.setAttribute('aria-expanded', 'false');

		// Ricorda che lo sviluppatore lo ha chiuso.
		this.setStoredOpenState('0');
	},

	getStoredOpenState() {
		try {
			return localStorage.getItem(this.storageKey);
		} catch (error) {
			// Alcuni browser bloccano localStorage in modalita' particolari.
			return null;
		}
	},

	setStoredOpenState(value) {
		try {
			localStorage.setItem(this.storageKey, value);
		} catch (error) {
			// Il menu resta utilizzabile anche se localStorage non e' disponibile.
		}
	},

	toggle() {
		// Stato visivo unico: se il root ha "open" chiudiamo, altrimenti apriamo.
		if (this.root.classList.contains('open')) {
			this.close();
		} else {
			this.open();
		}
	},

	async jumpTo(label) {
		this.setStatus(`Salto a ${label}...`);

		try {
			// Prima di saltare puliamo overlay, audio e minigiochi custom.
			await this.resetRuntimeState(label);

			// Piccola pausa per permettere al DOM di rimuovere overlay e classi.
			await sleep(30);

			// Sblocca Monogatari se il gioco era fermo dentro wait, video, glitch, ecc.
			if (typeof monogatari.global === 'function') {
				monogatari.global('block', false);
			}

			// Salto effettivo: usa l'azione Monogatari "jump NomeLabel".
			const result = monogatari.run(`jump ${label}`);

			// Alcune versioni di Monogatari restituiscono una Promise.
			if (result && typeof result.catch === 'function') {
				result.catch((error) => this.handleJumpError(error, label));
			}

			this.setStatus(`Label corrente: ${label}`);
		} catch (error) {
			this.handleJumpError(error, label);
		}
	},

	async resetRuntimeState(targetLabel = null) {
		// Chiude eventuali testi TypeCentered rimasti sopra la scena.
		this.resolveCenteredText();

		// Tenta di sbloccare il motore prima di cambiare label.
		if (typeof monogatari.global === 'function') {
			monogatari.global('block', false);
		}

		// Ferma vibrazioni native del dispositivo, se supportate.
		if (navigator.vibrate) {
			navigator.vibrate(0);
		}

		// Ferma il loop audio della respirazione, se era partito.
		if (PanicBreath.state !== 'idle') {
			PanicBreath.stop();
		}

		// Ferma il glitch/minigioco se e' attivo; altrimenti pulisce solo WordsGame.
		if (Glitch.active) {
			await Glitch.stop(false);
		} else {
			WordsGame.reset();
		}

		// Pulisce il telefono e gli overlay custom prima del salto.
		PhoneUI.hide();
		PhoneUI.reset();
		this.resetNightRuntime();
		this.resetVisualOverlays();
		this.resetStorageFlags(targetLabel);
	},

	resolveCenteredText() {
		// TypeCentered prosegue al primo click e si chiude al secondo.
		// Il remove finale e' una cintura di sicurezza se l'azione era gia' risolta.
		document.querySelectorAll('.type-centered-container').forEach((container) => {
			container.click();
			container.click();
			container.remove();
		});
	},

	resetNightRuntime() {
		// Riporta la torcia allo stato spento e bloccato.
		NightOverlay.isFrozen = true;
		NightOverlay.hasPlayedSound = false;

		// Rimuove buio/maschera torcia dal DOM, se presenti.
		const overlay = NightOverlay.element || document.getElementById('night-overlay');
		if (overlay) {
			overlay.classList.remove('visible', 'torch');
			overlay.style.maskImage = 'none';
			overlay.style.webkitMaskImage = 'none';
		}

		// Pulisce oggetti cliccabili e pannelli dettaglio della scena torcia.
		hideClickableObjects();
		document.getElementById('detail-blur')?.remove();
		document.getElementById('detail-zoom')?.remove();
		document.getElementById('detail-back')?.remove();
		document.getElementById('detail-desc')?.remove();
	},

	resetVisualOverlays() {
		// WordsGame blocca lo scroll del body: qui lo ripristiniamo.
		document.body.style.overflow = '';

		// Rimuove parole rimaste a schermo e pressione visiva della fase.
		const wordGame = document.getElementById('word-game-overlay');
		if (wordGame) {
			wordGame.classList.remove('visible', 'locked');
			wordGame.innerHTML = '';
			wordGame.style.setProperty('--phase-pressure', '0');
		}

		// Spegne il bordo rosso della scena rabbia.
		const rageBorder = document.getElementById('rage-border');
		if (rageBorder) {
			rageBorder.style.opacity = '0';
		}

		// Spegne l'overlay rosso/nero del game over del glitch.
		const gameOver = document.getElementById('glitch-game-over');
		if (gameOver) {
			gameOver.classList.remove('visible');
			gameOver.style.opacity = '0';
			gameOver.style.background = 'transparent';
		}

		// Riapre eventuali palpebre chiuse e rimuove il nero di transizione scena.
		document.getElementById('blink-overlay')?.classList.remove('closed');
		document.getElementById('sceneFadeOverlay')?.classList.remove('covering');
	},

	resetStorageFlags(targetLabel = null) {
		const store = monogatari.storage();
		if (!store) return;

		// Stato del minigioco rabbia: riparte sempre dalla fase 1.
		store.glitchGameCompleted = false;
		store.glitchGamePhase = 1;

		// Stato della torcia: nessun dettaglio oggetto rimane selezionato.
		store.lastClickedObject = null;

		// Se facciamo reset generico o saltiamo all'inizio/torcia, gli oggetti vanno ricliccati.
		if (targetLabel === null || targetLabel === 'Torcia' || targetLabel === 'Start') {
			store.clickedObjects = [];
			store.allClicked = false;
		}
	},

	refreshStatus() {
		if (!this.status) return;

		let currentLabel = '-';

		try {
			// Monogatari salva il label corrente nello state interno.
			if (typeof monogatari.state === 'function') {
				currentLabel = monogatari.state('label') || '-';
			}
		} catch (error) {
			currentLabel = '-';
		}

		this.status.textContent = `Label corrente: ${currentLabel}`;
	},

	setStatus(text) {
		// Metodo piccolo per aggiornare la status bar da piu' punti del menu.
		if (this.status) {
			this.status.textContent = text;
		}
	},

	handleJumpError(error, label) {
		// Log tecnico per console + feedback leggibile nel pannello.
		console.error(`Debug jump failed for ${label}`, error);
		this.setStatus(`Errore salto: ${label}`);
	}
};

/*UTILITY*/
function lerp (a, b, t){
	return a + (b - a) * t;
} 

function sleep(ms){
	return new Promise(resolve => setTimeout(resolve, ms));
}

function showTextbox(){
	document.body.classList.add('show-textbox');
	document.body.classList.remove('hide-textbox');
}

function hideTextBox(){
	document.body.classList.add('hide-textbox')
	document.body.classList.remove('show-textbox');
}
		
$_ready (() => {
	// 2. Inside the $_ready function:

	monogatari.on('start', () => {
		const screens = document.querySelectorAll('game-screen[data-component="game-screen"]');
		console.log("Sono entrato, screens:" + screens);
		if(screens)
			screens.forEach(s => {s.style.backgroundColor = "transparent";});

		// Quando il giocatore lascia il menu principale e parte una scena, il pulsante telefono puo apparire.
		if (PhoneToggle.root) {
			PhoneToggle.queueRefreshVisibility();
		}
	})

	monogatari.init ('#monogatari').then (() => {
		// 3. Inside the init function:
		// Il telefono viene inizializzato subito, ma resta nascosto finche una scena lo apre.
		PhoneUI.init();

		// Il toggle e' indipendente dal telefono: decide solo quando mostrare il pulsante e il badge.
		PhoneToggle.init();

		// Il toggle globale evita di creare il menu quando DEBUG_MENU_ENABLED e' false.
		if (DEBUG_MENU_ENABLED) {
			DebugMenu.init();
		}

	});
});
