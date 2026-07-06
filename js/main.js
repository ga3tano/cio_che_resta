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
		this.fontFamily = options.fontFamily ?? 'Pangolin';	//old - monospace
	}

	apply () {
		return new Promise ((resolve) => {
			const root = document.querySelector ('#monogatari') ?? document.body;

			const container = document.createElement ('div');
			container.classList.add ('type-centered-container');

			const paragraph = document.createElement ('div');
			paragraph.classList.add ('type-centered-text');

			// fontFamily resta inline: arriva dalle options dello statement.
			paragraph.style.fontFamily = this.fontFamily;

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

				//se serve, lavorare direttamente su apply o si sminchiano tutti i tempi di gioco, non usare ASSOLUTAMENTE run('next')
				// if(!choice.doAction.trim().startsWith('jump'))
				// 	monogatari.run('next');
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
	messageAdvanceResolve: null,
	messageAdvanceEventsBound: false,	

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

	/*
		Mostra la lockscreen con il pulsante "Accendi la torcia" e attende
		che venga premuto. La scena resta bloccata sull'await finché il
		giocatore non tocca il pulsante; poi il telefono si chiude da solo.
	*/
	waitForTorchUnlock() {
		if (!this.layer) this.init();

		this.showLockScreen();
		this.lockView.classList.add('torch-mode');

		return new Promise((resolve) => {
			const torchButton = document.getElementById('phone-lock-torch');

			torchButton.addEventListener('click', (event) => {
				// Il click non deve risalire alla lockscreen e aprire la chat.
				event.stopPropagation();

				this.lockView.classList.remove('torch-mode');
				this.hide();
				resolve();
			}, { once: true });
		});
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
        // this.stopVibration();
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

		if(!PhoneToggle.visible)
			PhoneToggle.show();

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

	// addPlaceholder(){
	// 	const item = document.createElement('div');
	// 		item.className = 'lock-notification';

	// 		const icon = document.createElement('div');
	// 		icon.className = 'lock-notification-icon';
	// 		icon.setAttribute('aria-hidden', 'true');

	// 		const text = document.createElement('div');
	// 		text.className = 'lock-notification-text';

	// 		const title = document.createElement('div');
	// 		title.className = 'lock-notification-title';
	// 		title.textContent = "Nessun nuovo messaggio.";

	// 		const subtitle = document.createElement('div');
	// 		subtitle.className = 'lock-notification-subtitle';
	// 		subtitle.textContent = "Messaggi";

	// 		text.appendChild(title);
	// 		text.appendChild(subtitle);
	// 		item.appendChild(icon);
	// 		item.appendChild(text);
	// 		item.setAttribute('pointer-events', 'none');
	// 		this.lockNotifications.appendChild(item);
	// },

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

	/**
	 * waitUntilAllNotificationsRead - Returns a promise that resolves when the
	 * unread notifications count reaches zero or when the timeout elapses.
	 * Useful to pause game flow until the player opens the phone and reads
	 * the notifications (which marks them as read).
	 */
	waitUntilAllNotificationsRead(timeout = 20000, pollInterval = 150) {
		return new Promise((resolve) => {
			const start = Date.now();

			if (this.getUnreadCount() === 0) {
				resolve('already-empty');
				return;
			}

			const tick = () => {
				if (this.getUnreadCount() === 0) {
					resolve('read');
					return;
				}

				if (Date.now() - start >= timeout) {
					resolve('timeout');
					return;
				}

				setTimeout(tick, pollInterval);
			};

			setTimeout(tick, pollInterval);
		});
	},

	renderNotifications() {
		if (!this.lockNotifications) return;

		this.lockNotifications.innerHTML = '';
		this.lockNotifications.classList.toggle('is-empty', this.unreadNotifications.length === 0);

		/*
			Ogni notifica mostrata qui corrisponde a 1 numero nel badge.
			Se vuoi raggruppare piu messaggi in una sola card, questo e' il punto da modificare.
		*/
		// Raggruppa per titolo (mittente): se una chat ha 3+ notifiche, mostra 1 card cumulativa
		const groups = new Map();
		this.unreadNotifications.forEach((n) => {
			if (!groups.has(n.title)) groups.set(n.title, []);
			groups.get(n.title).push(n);
		});

		groups.forEach((items) => {
			const isGrouped = items.length >= 3;
			const last = items[items.length - 1]; // card mostra sempre l'ultimo messaggio ricevuto

			const item = document.createElement('div');
			item.className = 'lock-notification';

			const icon = document.createElement('div');
			icon.className = 'lock-notification-icon';
			icon.setAttribute('aria-hidden', 'true');

			const text = document.createElement('div');
			text.className = 'lock-notification-text';

			const title = document.createElement('div');
			title.className = 'lock-notification-title';
			// Badge conteggio nel titolo, es. "Giulia (4)", solo se raggruppato
			title.textContent = isGrouped ? `${last.title} (${items.length})` : last.title;

			const subtitle = document.createElement('div');
			subtitle.className = 'lock-notification-subtitle';
			subtitle.textContent = last.body;

			text.appendChild(title);
			text.appendChild(subtitle);
			item.appendChild(icon);
			item.appendChild(text);
			this.lockNotifications.appendChild(item);
		});

		if (typeof PhoneToggle !== 'undefined') {
			PhoneToggle.updateBadge(this.getUnreadCount());
		}

		// Senza messaggi da leggere lo sblocco e' disabilitato: l'hint
		// "Tocca per sbloccare" sparisce per non promettere il contrario.
		const hint = this.lockView?.querySelector('.lock-hint');
		if (hint) {
			hint.style.visibility = this.unreadNotifications.length ? 'visible' : 'hidden';
		}
	},

	bindLockscreenEvents() {
		if (!this.lockView || this.unlockEventsBound) return;

		const unlock = (event) => {
			// In modalità torcia il tocco non sblocca la chat: niente preventDefault,
			// così su mobile il click sintetico arriva al pulsante torcia.
			if (this.lockView.classList.contains('torch-mode')) return;

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

		// Nessun messaggio da leggere: la lockscreen resta bloccata.
		if (this.getUnreadCount() === 0) return;

		this.showChatView({ markNotificationsAsRead: true });
	},

    // vibrate(duration = 900) {
    //     if (!this.layer) this.init();

    //     this.shell.classList.add('vibrating');

    //     if (navigator.vibrate) {
    //         navigator.vibrate([200, 100, 200]);
    //     }

    //     setTimeout(() => {
    //         this.stopVibration();
    //     }, duration);
    // },

    // stopVibration() {
    //     if (!this.shell) return;
    //     this.shell.classList.remove('vibrating');
    // },

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
    },

	bindMessageAdvanceEvents() {
		if (this.messageAdvanceEventsBound || !this.chatView) return;

		const advance = (event) => {
			if (!this.messageAdvanceResolve) return;

			event.preventDefault();
			event.stopPropagation();

			const resolve = this.messageAdvanceResolve;
			this.messageAdvanceResolve = null;
			resolve();
		};

		this.chatView.addEventListener('click', advance);
		this.chatView.addEventListener('touchend', advance);

		this.messageAdvanceEventsBound = true;
	},

	waitForMessageAdvance() {
		this.bindMessageAdvanceEvents();

		return new Promise(resolve => {
			this.messageAdvanceResolve = resolve;
		});
	},

	addPhoneMessage(message) {
		const options = message.options || {};

		if (message.type === 'outgoing') {
			this.addOutgoing(message.text, options);
			return;
		}

		this.addIncoming(message.text, options);
	},

	async playMessages(messages = []) {
		if (!this.layer) this.init();

		const list = Array.isArray(messages) ? messages : [messages];

		for (const message of list) {
			this.addPhoneMessage(message);
			await this.waitForMessageAdvance();
		}
	}
}

const PhoneTyping = {
    composer: null,
    inputText: null,
    sendBtn: null,
    currentText: '',
    fullText: '',
    charIndex: 0,
    isAnimating: false,
    onComplete: null, // callback quando finisce
	keySound: null, //reference all'audio del tap su tastiera
	sendSound: null, //audio dell'invio

    /**
     * Inizializza i riferimenti DOM.
     */
    init() {
        this.composer = document.getElementById('phone-composer');
        this.inputText = document.getElementById('phone-input-text');
        this.sendBtn = document.getElementById('phone-send-btn');

		this.keySound = new Audio('assets/sounds/phone_type.mp3');
		this.sendSound = new Audio('assets/sounds/phone_send.mp3');
		this.sendSound.volume = this.keySound.volume = 0.3;
    },

    /**
     * Mostra il compositore e anima la scrittura del testo.
     * @param {string} text - Il testo completo da "digitare"
     * @param {number} speed - Millisecondi tra un carattere e l'altro (default 80)
     * @param {Function} onComplete - Callback quando la digitazione finisce
     */
    show(text, speed = 80, onComplete = null) {
        if (!this.composer) this.init();
        
        this.fullText = text;
        this.currentText = '';
        this.charIndex = 0;
        this.isAnimating = true;
        this.onComplete = onComplete;

        this.composer.style.display = 'flex';
        this.sendBtn.disabled = true;
        this.inputText.textContent = '';

        this._typeNextChar(speed);
    },

    /**
     * Digita un carattere alla volta.
     */
    _typeNextChar(speed) {
        if (this.charIndex >= this.fullText.length) {
            this._finish();
            return;
        }

        this.currentText += this.fullText[this.charIndex];
        this.inputText.textContent = this.currentText;
        this.charIndex++;

		if (this.keySound){
			this.keySound.currentTime = 0;
			this.keySound.play().catch(() => {});	//catch vuoto per ignorare gli errori 
		}

        // Variazione casuale della velocità per realismo (±30%)
        const variation = speed * (0.7 + Math.random() * 0.6);
        
        setTimeout(() => this._typeNextChar(speed), variation);
    },

    /**
     * Termina l'animazione di scrittura.
     */
    _finish() {
        this.isAnimating = false;
        this.sendBtn.disabled = false;
		
		if (typeof this.onComplete === 'function') {
            this.onComplete();
        }
    },

    /**
     * Simula il click sul tasto invio.
     * Chiamala quando vuoi "inviare" il messaggio.
     */
    send() {
        if (this.isAnimating) return;
        
        this.sendBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.sendBtn.style.transform = '';
			this.sendSound.currentTime = 0;
			this.sendSound.play().catch(() => {});
        }, 100);
    },

    /**
     * Nasconde il compositore.
     */
    hide() {
        if (!this.composer) return;
        this.composer.style.display = 'none';
        this.isAnimating = false;
    }
}

const PhoneToggle = {
	/*
		Controller del pulsante globale.
		Questo oggetto non gestisce i messaggi: mostra/nasconde solo il bottone,
		inoltra il click a PhoneUI e aggiorna il badge numerico.

		La visibilita' non e' piu' automatica in base allo screen attivo:
		va gestita esplicitamente chiamando PhoneToggle.show() / .hide()
		dagli script della visual novel (es. nei comandi Monogatari delle scene).
	*/
	root: null,
	button: null,
	badge: null,
	eventsBound: false,
	visible: false,

	init() {
		this.root = document.getElementById('phone-toggle');
		this.button = document.getElementById('phone-toggle-button');
		this.badge = document.getElementById('phone-toggle-badge');

		if (!this.root || !this.button || !this.badge) return;

		this.bindEvents();
		this.updateBadge(PhoneUI.getUnreadCount());

		// Stato iniziale: nascosto finche' non viene mostrato esplicitamente.
		this.applyVisibility();
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

	show() {
		this.visible = true;
		this.applyVisibility();
	},

	hide() {
		this.visible = false;
		this.applyVisibility();
	},

	applyVisibility() {
		if (!this.root || !this.button) return;

		this.root.classList.toggle('visible', this.visible);
		this.root.setAttribute('aria-hidden', String(!this.visible));
		this.button.disabled = !this.visible;

		// Se nascondiamo il pulsante, il telefono non deve restare aperto.
		if (!this.visible && PhoneUI.layer && PhoneUI.isVisible()) {
			PhoneUI.hide();
		}
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
	},

	lockToggle(lock){
		if (!this.root) return;
		
		if(lock) this.root.classList.add('disabled');
		else this.root.classList.remove('disabled');
	}
};

//CREDITS TO STANKO: https://codepen.io/stanko/pen/emYEpvP
// const PhoneGlitch = {
//     PHONE_SNAPSHOT_URL: '/assets/images/phone-glitch-snapshot.png',

//     colorPresets: [
//         { c1: 'rgba(255,60,90,0.4)', c2: 'rgba(60,220,220,0.4)', hue: 0 },
//         { c1: 'rgba(230,80,190,0.35)', c2: 'rgba(90,220,150,0.35)', hue: 35 },
//         { c1: 'rgba(140,90,230,0.4)', c2: 'rgba(220,210,90,0.35)', hue: -30 },
//         { c1: 'rgba(80,150,230,0.4)', c2: 'rgba(230,130,70,0.4)', hue: 20 }
//     ],

//     stripPool: [],
//     running: false,
//     timers: [],

//     rand(min, max) {
//         return Math.round(Math.random() * (max - min)) + min;
//     },

//     pick(arr) {
//         return arr[Math.floor(Math.random() * arr.length)];
//     },

//     randomStripHeight() {
//         const r = Math.random();
//         if (r < 0.5) return this.rand(3, 10);
//         if (r < 0.85) return this.rand(10, 26);
//         return this.rand(26, 60);
//     },

//     nextShift() {
//         const dir = Math.random() < 0.5 ? -1 : 1;
//         const magnitude = this.rand(16, 48);
//         return dir * magnitude;
//     },

//     buildStripPool(shellEl, glitchEl, imageUrl) {
//         glitchEl.innerHTML = '';
//         glitchEl.style.setProperty('--phone-snapshot', `url(${imageUrl})`);
//         this.stripPool = [];

//         const h = shellEl.offsetHeight;
//         let y = 0;

//         while (y < h) {
//             let stripH = this.randomStripHeight();
//             if (y + stripH > h) stripH = h - y;

//             const strip = document.createElement('div');
//             strip.className = 'phone-glitch-strip';
//             strip.style.top = `${(y / h) * 100}%`;
//             strip.style.height = `${(stripH / h) * 100}%`;
//             strip.style.backgroundPosition = `0 ${(y / h) * 100}%`;
//             strip.style.backgroundSize = `100% ${(h / stripH) * 100}%`;

//             glitchEl.appendChild(strip);
//             this.stripPool.push(strip);
//             y += stripH;
//         }
//     },

//     setStripState(strip, on, preset, xShift) {
//         if (on) {
//             const dir = xShift >= 0 ? 1 : -1;
//             strip.style.transition = 'none';
//             strip.style.transform = `translateX(${xShift}px)`;
//             strip.style.filter = `saturate(1.7) contrast(1.2) hue-rotate(${preset.hue}deg) drop-shadow(${dir * 5}px 0 0 ${preset.c1}) drop-shadow(${-dir * 5}px 0 0 ${preset.c2})`;
//         } else {
//             strip.style.transition = 'transform 40ms linear, filter 40ms linear';
//             strip.style.transform = 'translateX(0)';
//             strip.style.filter = 'none';
//         }
//     },

//     scheduleStrip(strip) {
//         if (!this.running) return;

//         const idleDelay = this.rand(30, 500);
//         const t1 = setTimeout(() => {
//             if (!this.running) return;

//             const preset = this.pick(this.colorPresets);
//             const xShift = this.nextShift();
//             const holdDuration = this.pick([
//                 this.rand(20, 60),
//                 this.rand(60, 140),
//                 this.rand(140, 320)
//             ]);

//             this.setStripState(strip, true, preset, xShift);

//             const t2 = setTimeout(() => {
//                 if (!this.running) return;
//                 this.setStripState(strip, false);
//                 this.scheduleStrip(strip);
//             }, holdDuration);
//             this.timers.push(t2);
//         }, idleDelay);
//         this.timers.push(t1);
//     },

//     trigger(totalDuration = 5000) {
//         const shell = document.getElementById('phone-shell');
//         const glitch = document.getElementById('phone-glitch');

//         if (this.stripPool.length === 0) {
//             this.buildStripPool(shell, glitch, this.PHONE_SNAPSHOT_URL);
//         }

//         this.running = true;
//         glitch.classList.add('active');

//         const activeCount = Math.max(5, Math.round(this.stripPool.length * 0.55));
//         const shuffled = this.stripPool.slice().sort(() => Math.random() - 0.5);
//         for (let i = 0; i < activeCount; i++) {
//             this.scheduleStrip(shuffled[i]);
//         }

//         setTimeout(() => {
//             this.running = false;
//             this.timers.forEach(clearTimeout);
//             this.timers = [];
//             this.stripPool.forEach(s => this.setStripState(s, false));
//             glitch.classList.remove('active');
//         }, totalDuration);
//     },

//     stop() {
//         this.running = false;
//         this.timers.forEach(clearTimeout);
//         this.timers = [];
//         this.stripPool.forEach(s => this.setStripState(s, false));
//         const glitch = document.getElementById('phone-glitch');
//         if (glitch) glitch.classList.remove('active');
//     }
// };

const PhoneGlitch = {
	async glitchText(el, newText, newClass, duration = 800) {
		const originalText = el.textContent;
		const chars = '!@#$%&*()_+-=[]{}|;:,.<>?/\\';
		const startTime = Date.now();
		const endTime = startTime + duration;
		const baseText = originalText.split('');

		//Heartbeat is already playing from script
		HeartbeatManager.accelerate(160, duration / 1000);
		//Start the glitch audio too
		await AudioManager.play('glitch', {
			glitch: true,
			volume: 0.2,
			fadeIn: 3,
			glitchDuration: duration / 1000
		});

		return new Promise((resolve) => {
			const scramble = () => {
				const remaining = endTime - Date.now();

				if (remaining <= 0) {
					HeartbeatManager.stop();
					AudioManager.stop('glitch');
					el.innerHTML = newText;
					el.classList.add(newClass);
					el.classList.remove('glitch-active');
					el.removeAttribute('data-glitch-text');
					resolve();
					return;
				}

				// t: 0 at start, 1 at apex (end of duration)
				const t = 1 - (remaining / duration);

				// Eased curve: slow ramp early, steep ramp near the apex.
				// Try t*t (quadratic) first; use t**3 for an even lazier start.
				const eased = t * t;

				// Chaos grows with the eased curve: mostly real chars early,
				// mostly noise near the apex.
				const chaos = eased; // 0 = calm, 1 = max scramble

				const scrambled = baseText.map((char) => {
					if (char === ' ') return ' ';
					if (Math.random() < chaos) {
						return chars[Math.floor(Math.random() * chars.length)];
					}
					return char;
				}).join('');

				el.textContent = scrambled;
				el.setAttribute('data-glitch-text', scrambled);

				// Speed also eases: long delays early (slow), short delays
				// near the apex (fast). Interpolate between a slow and fast bound.
				const minDelay = 25;   // fastest tick, near apex
				const maxDelay = 140;  // slowest tick, at start
				const delay = maxDelay - (maxDelay - minDelay) * eased;
				const jitter = delay * (0.3 * Math.random()); // small randomness so it doesn't feel robotic

				setTimeout(scramble, delay + jitter);
			};

			scramble();
		});
	},

    zoomShell(duration = 2000, scale = 1.03) {
		const shell = document.getElementById('phone-shell');

		// Stato di partenza esplicito
		shell.style.transition = 'none';
		shell.style.transform = 'translateY(-4vh) scale(1)';

		// Forza il browser a committare questo stato prima di animare
		void shell.offsetHeight;

		const startTime = performance.now();
		const fromScale = 1;
		const toScale = scale;

		const animate = (now) => {
			const t = Math.min(1, (now - startTime) / duration);

			// Stessa curva di glitchText: lento all'inizio, veloce verso la fine
			const eased = t * t;

			const currentScale = fromScale + (toScale - fromScale) * eased;
			shell.style.transform = `translateY(-4vh) scale(${currentScale})`;

			if (t < 1) {
				requestAnimationFrame(animate);
			}
		};

		requestAnimationFrame(animate);
	},

    unzoomShell(duration = 1000, fromScale = null) {
		const shell = document.getElementById('phone-shell');
		shell.style.transition = 'none';
		void shell.offsetHeight;

		const startTime = performance.now();
		const startScale = fromScale ?? (parseFloat(getComputedStyle(shell).transform.match(/[\d.]+/g)?.pop()) || 1.03);	//All of that to cover the case zoom ends earlier and not getting to 1.03, avoiding unwanted pop animation

		const animate = (now) => {
			const t = Math.min(1, (now - startTime) / duration);
			const eased = t * t;
			const currentScale = startScale + (1 - startScale) * eased;
			shell.style.transform = `translateY(-4vh) scale(${currentScale})`;
			if (t < 1) requestAnimationFrame(animate);
		};

		requestAnimationFrame(animate);
	},

    glitchBubble(el) {
		el.classList.add('glitch-active');
		el.setAttribute('data-glitch-text', el.textContent);
    },

    async sequence(bubbleEl, newText, newClass, duration, scale) {
		this.zoomShell(duration, scale);
		this.glitchBubble(bubbleEl);

		await this.glitchText(bubbleEl, newText, newClass, duration);
		this.unzoomShell(duration/(2*(duration/1000)), scale);	//hard coded to 0.5s
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
		
		//Desktop: aggiorna il target come il touch, altrimenti il loop rAF
		//riporta la torcia verso il vecchio target a ogni frame.
		document.addEventListener('mousemove', (e) => {
			if(!this.element.classList.contains('torch')) return;
			this.targetX = e.clientX;
			this.targetY = e.clientY;
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

		 // Attiva i touch sul wrapper
		SceneUtility.unlockItemWrapper()

		const x = window.innerWidth / 2;
    	const y = window.innerHeight / 2;

    	this.updateTorch(x, y);

		// Hint "esplora la stanza" solo la prima volta, finché non evidenzia qualcosa
		if (!monogatari.storage().clickedObjects.length) TorchHint.arm();

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
		this.isFrozen = true;
		if(!this.element) this.init();

		TorchHint.dismiss();

		this.playTorchSound();
		this.element.classList.remove('torch');
		this.element.style.maskImage = 'none';
		this.element.style.webkitMaskImage = 'none';
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

// Scritta lampeggiante nella scena torcia: appare se dopo 3 secondi
// il giocatore non ha ancora evidenziato nessun oggetto con dialogo.
const TorchHint = {
	el: null,
	timer: null,

	arm(){
		this.dismiss();
		this.timer = setTimeout(() => {
			if (!this.el) {
				this.el = document.createElement('div');
				this.el.id = 'torch-hint';
				this.el.textContent = 'Esplora i vari elementi della stanza';
				document.body.appendChild(this.el);
			}
			this.el.classList.add('visible');
		}, 3000);
	},

	dismiss(){
		clearTimeout(this.timer);
		this.timer = null;
		this.el?.classList.remove('visible');
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
			timeLimit: 9000,
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
			timeLimit: 8000,
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

		if (!store.glitchTutorialShown) {
			await WordsGame.tutorial();
			store.glitchTutorialShown = true;
		}	

		//Avvio il battito cardiaco
		await HeartbeatManager.load(); //Mi assicuro che i buffer con gli audio siano caricati prima di partire
		HeartbeatManager.start({bpm: 75, volume: 1, fadeIn: 1});

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
							//Sincronizzo la decelerazione con l'inizio di una nuova fase, e decelero a un bpm sempre più alto
							await this.cooldown(1400, 0.16, { bpmFrom: 160, bpmTo: 90});
							break;
						case 2: 
							await this.cooldown(700, 0.05, {bpmFrom: 170, bpmTo: 110});
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
		//old
		// this.phaseResolved = false;
		// this.intensity = 0; //era phase.intensityStart, provo a far partire sempre da zero
		// this.startTime = performance.now();
		// this.runLoop(phase);


		//New
		this.phaseResolved= false;
		this.startTime = performance.now();

		// Calcola l'intensità iniziale inversamente proporzionale alla durata
		// Fase più corta = parte più forte
		// 10000ms (fase1) → intensityStart basso
		// 8000ms (fase3) → intensityStart più alto
		const maxDuration = this.phases[0].timeLimit; // 10000ms, la fase più lunga
		const minDuration = this.phases[2].timeLimit; // 8000ms, la fase più corta

		// Mi assicura che il battito sia in riproduzione prima di accelerare in caso di reset
		if (!HeartbeatManager.isPlaying) {
			HeartbeatManager.start({ bpm: 75, volume: 0.4, fadeIn: 0.3 });
		}

		// Normalizza: 0 = fase più lunga, 1 = fase più corta
    	const urgency = (maxDuration - phase.timeLimit) / (maxDuration - minDuration);


		// Mappa a un range di intensità iniziale: da 0.05 a 0.30
    	this.intensity = 0.05 + urgency * 0.25;
		
		//Fa partire la fase
    	this.runLoop(phase);

		// Mappa l'intensità iniziale della fase a un BPM target.
	// intensityStart: 0.14 (fase 1) → 0.52 (fase 3)
	// BPM target:     ~94 (fase 1) → ~158 (fase 3)
	// Formula: BPM base (70) + intensità × range (170)
	const phaseBpm = 70 + (phase.intensityStart * 170);
	HeartbeatManager.setBpm(phaseBpm, { duration: phase.timeLimit / 1000 });
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

			// // L'intensità parte dal valore minimo della fase
			// // e arriva gradualmente a 1 man mano che si esaurisce il tempo.
			// this.intensity = phase.intensityStart + (1 - phase.intensityStart) * rampProgress;	

			// Nuovo: parte da 0 e arriva a 1, ma la velocità è data da intensityStart
			const speedFactor = 1 - phase.intensityStart; // più intensityStart è alto, più il boost è piccolo
			const boostedProgress = rampProgress / (rampProgress + speedFactor * (1 - rampProgress));
			this.intensity = boostedProgress;

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

		// //Decelera verso 60BPM in 2 secondi
		// HeartbeatManager.decelerate(75, 0.5);
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
		
		// Riavvio il battito per il nuovo tentativo
		HeartbeatManager.start({ bpm: 75, volume: 0.4, fadeIn: 0.5 });
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
	cooldown(duration = 700, targetIntensity = 0, bpmRange = null, restoreAtEnd = false) {
		if (!this.shakeWrapper?.isConnected) {
			if (!this.prepareShakeWrapper()) {
				return Promise.resolve();
			}
		}

		const border = document.getElementById("rage-border");

		// Salviamo l'intensità iniziale del rientro:
		// da qui partiremo per tornare gradualmente a zero.
		const startingIntensity = this.intensity;

		// Rallento il battito
		HeartbeatManager.setBpm(60 - (startingIntensity * 30), {duration: duration / 1000});

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

				if(bpmRange){
					const bpm = bpmRange.from + (bpmRange.to - bpmRange.from) * eased;
					HeartbeatManager.setBpm(bpm);
				}

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

		// Fermo il battito con fadeOut mentre parte il rosso
		HeartbeatManager.stop({fadeOut: 0.85});

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
			HeartbeatManager.stop({fadeOut: 0.3});
		}
		else{
			HeartbeatManager.stop({fadeOut: 2});
		}

		await this.cooldown(500, 0, 0, true);
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

		const wordsByPhase = {
			fase1: 6,
			fase2: 7,
			fase3: 8
		};

		const amount = wordsByPhase[phase.label] || 5;

		const phaseWords = words.slice(0, 12);
		this.shuffleArray(phaseWords);

		const selectedWords = phaseWords.slice(0, amount);

		this.activeWords = selectedWords.length;

		for (let i = 0; i < selectedWords.length; i++) {
			if (!this.isCurrentRun(runId)) return;

			const wordObj = this.createWordElement(selectedWords[i]);
			this.element.appendChild(wordObj.wrapper);

			this.freezeWordLayout(wordObj.textNode, wordObj.label, wordObj.wrapper);

			const point = spawnPoints[i % spawnPoints.length];
			this.placeWord(wordObj.wrapper, point);
			this.attachTouchSwipe(wordObj.wrapper, runId);

			if (i < selectedWords.length - 1) {
				await this.wait(phase.spawnDelay, runId);
			}
		}
	},

	// Tutorial swipe: 1 parola ferma + manina che oscilla, stesso movimento sincronizzato.
	// Si chiude SOLO quando il giocatore swipa fuori schermo (nessun timeout).
	tutorial() {
		if (!this.element) this.init();

		return new Promise((resolve) => {
			const overlay = document.createElement("div");
			overlay.className = "tutorial-overlay";
			this.element.appendChild(overlay);
			this.element.classList.add("visible");

			const wordObj = this.createWordElement("AAAARGH!");
			overlay.appendChild(wordObj.wrapper);
			this.freezeWordLayout(wordObj.textNode, wordObj.label, wordObj.wrapper);

			const cx = window.innerWidth / 2 - wordObj.wrapper.offsetWidth / 2;
			const cy = window.innerHeight / 2 - wordObj.wrapper.offsetHeight / 2;
			wordObj.wrapper.style.left = `${cx}px`;
			wordObj.wrapper.style.top = `${cy}px`;
			wordObj.wrapper.style.visibility = "visible";

			const hand = document.createElement("img");
			hand.className = "tutorial-hand";
			hand.src = "assets/images/swipe-hand.png";
			hand.style.top = `${cy + wordObj.wrapper.offsetHeight}px`
			hand.style.left = `${cx + (wordObj.wrapper.offsetWidth / 2) - 26}px`
			overlay.appendChild(hand);

			// Wiggle: solo estetico, non tocca transform del wrapper (riservato al drag reale)
			wordObj.label.style.animation = "tutorialWiggle 900ms ease-in-out infinite";
			hand.style.animation = "tutorialWiggle 900ms ease-in-out infinite";

			// runId fittizio: attachTouchSwipe lo confronta con this.runId/isActive
			this.isActive = true;
			this.runId += 1;
			const runId = this.runId;

			// Overrida solo il cleanup finale: stessa meccanica di endDrag, ma risolve il tutorial invece di resolveRun
			const originalRemove = wordObj.wrapper.remove.bind(wordObj.wrapper);
			wordObj.wrapper.remove = () => {
				originalRemove();
				overlay.remove();
				this.element.classList.remove("visible");
				this.isActive = false;
				resolve();
			};

			wordObj.wrapper.addEventListener("pointerdown", () => {
				hand.style.display = "none";
			}, { once: true });

			this.attachTouchSwipe(wordObj.wrapper, runId);
		});
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

		// Pointer events: un solo set di listener copre touch e mouse.
		// .word-item ha touch-action: none nel CSS, quindi su mobile il drag
		// non viene interrotto dallo scroll del browser.
		wrapper.addEventListener("pointerdown", (event) => {
			if (!this.isCurrentRun(runId)) return;
			
			event.preventDefault();

			// Il capture fa arrivare pointermove/pointerup al wrapper anche se
			// il puntatore esce dai suoi bordi durante il drag.
			wrapper.setPointerCapture(event.pointerId);

			const rect = wrapper.getBoundingClientRect();

			dragging = true;
			wrapper.classList.add("dragging");
			wrapper.style.transition = "";

			startTouchX = event.clientX;
			startTouchY = event.clientY;
			currentLeft = parseFloat(wrapper.style.left) || 0;
			currentTop = parseFloat(wrapper.style.top) || 0;
			offsetX = event.clientX - rect.left;
			offsetY = event.clientY - rect.top;
			deltaX = 0;
			deltaY = 0;
		});

		wrapper.addEventListener("pointermove", (event) => {
			if (!dragging || !this.isCurrentRun(runId)) return;

			event.preventDefault();

			deltaX = event.clientX - startTouchX;
			deltaY = event.clientY - startTouchY;

			const newLeft = event.clientX - offsetX;
			const newTop = event.clientY - offsetY;

			wrapper.style.left = `${newLeft}px`;
			wrapper.style.top = `${newTop}px`;
		});

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

		wrapper.addEventListener("pointerup", endDrag);
		wrapper.addEventListener("pointercancel", endDrag);
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
		{ id: 'cornice_rotta', src: 'assets/images/cornice_rotta.png', onClick: 'assets/images/cornice.png', dialog: 'jump DialogoContrattazione_Cornice'},
		{ id: 'pianta_1', src: 'assets/images/pianta_1.png', onClick: 'assets/images/pianta_2.png', dialog: 'jump DialogoContrattazione_Pianta'},
		{ id: 'vestiti', src: 'assets/images/vestiti.png', onClick: 'assets/images/blank.png', dialog: 'jump DialogoContrattazione_Vestiti'}
	],
	'depressione': [
		{ id: 'cornice', src: 'assets/images/cornice.png'},
		{ id: 'pianta_2', src: 'assets/images/pianta_2.png'},
		{ id: 'uomo', src: 'assets/images/uomo.png'},
		{ id: 'ombra', src: 'assets/images/bambino_ombra.png', onClick: 'pipo', isVisible: 'false'}
	],
	// Schermata d'ingresso alla fase di accettazione: la stanza (room_day_dark)
	// con la sola porta che lampeggia. Riusa la stessa meccanica .highlight + click
	// degli oggetti della contrattazione. onClick punta alla stessa immagine (porta.png)
	// perché non vogliamo cambiare la grafica: al click parte solo il jump della scena.
	'accettazione_porta': [
		{ id: 'porta_acc', src: 'assets/images/porta.png', onClick: 'assets/images/porta.png', dialog: 'jump Scena_Accettazione' },
		// Oggetti già al loro posto ordinato (statici, non interattivi)
		{ id: 'pianta_3', src: 'assets/images/pianta_3.png' },
		{ id: 'cornice',  src: 'assets/images/cornice.png' }
	],
	'accettazione': [
		// onClick: immagine sostituita dopo il click (stato "sistemato")
		// dialog: label Monogatari lanciato dopo il click tramite lockContrattazioneObject
		{ id: 'tenda',            src: 'assets/images/tenda_chiusa.png',      onClick: 'assets/images/tenda_aperta.png',      dialog: 'jump DialogoAccettazione_Tenda', deferSwap: true },
		{ id: 'cesta',            src: 'assets/images/cesta_vuota.png',        onClick: 'assets/images/cesta_piena.png',        dialog: 'jump DialogoAccettazione_Cesta', deferSwap: true },
		// Oggetto statico, già al suo posto (non interattivo)
		{ id: 'porta_2', src: 'assets/images/porta_2.png' }
		// La porta NON fa parte della stanza durante il riordino: la fase finale
		// (creazione porta + uscita) è da sviluppare.
	],
	'torcia': [
		{ id: 'cornice', src: 'assets/images/cornice.png', lighted: true, dialog: 'jump DialogoTorcia_Cornice'},
		{ id: 'pianta_2', src: 'assets/images/pianta_2.png', lighted: true, dialog: 'jump DialogoTorcia_Pianta'},
		{ id: 'porta', src: 'assets/images/porta.png', lighted: true, dialog: 'jump DialogoTorcia_Porta' },
		{ id: 'mobile', src: 'assets/images/mobile.png', lighted: true, dialog: 'jump DialogoTorcia_Mobile'}
	]
}

// Contatore discreto "trovati/totale" per le scene a oggetti interattivi
// (torcia, contrattazione, accettazione). Solo feedback visivo: il gating
// vero resta nei loop label che confrontano clickedObjects/allObjects.
const ObjectCounter = {
	element: null,
	total: 0,
	count: 0,

	ensure() {
		if (!this.element) {
			this.element = document.createElement('div');
			this.element.id = 'object-counter';
			this.element.className = 'object-counter';
			document.body.appendChild(this.element);
		}
		return this.element;
	},

	show(total) {
		if (!total) return;
		this.total = total;
		this.count = 0;
		this.render();
		this.ensure().classList.add('visible');
	},

	increment() {
		if (!this.total) return;
		this.count = Math.min(this.count + 1, this.total);
		this.render();

		// A scena completata il contatore non serve più: sparisce da solo.
		if (this.count >= this.total) {
			setTimeout(() => this.hide(), 1500);
		}
	},

	render() {
		this.ensure().textContent = `${this.count}/${this.total}`;
	},

	hide() {
		this.total = 0;
		this.count = 0;
		this.element?.classList.remove('visible');
	}
};

const SceneUtility = {
	clickedItems: false,
	hoverTimer: null,
	currentHoveredId: null,

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
		// const overlay = document.getElementById("sceneFadeOverlay");	Adesso gestisco il fade a parte

		//Pulsco il cielo ogni volta da eventuali child (pioggia)
		sky.innerHTML = '';

		//Imposto l'immagine di background del div
		const imageSrc = `assets/scenes/cielo_${typeOfSky}.png`;

		//Aggiungo la pioggia
		if(typeOfSky === 'nuvolo'){
			const rain = document.createElement('img');

			rain.src = `assets/images/rain.gif`;
			rain.id = 'rain';
			rain.classList.add('rain');

			sky.appendChild(rain);
		}
			
		// overlay.classList.add("covering");	Come sopra

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
		// // Carica o crea il wrapper
		// let wrapper = document.getElementById('details-wrapper');
		

		// if (!wrapper) {
		// 	wrapper = document.createElement('div');
		// 	wrapper.id = 'details-wrapper';
		// 	wrapper.className = 'details-wrapper';

		// 	// Aggiungo il wrapper al gioco 
		// 	document.body.appendChild(wrapper);
		// }
		
		// // Pulisci il contenuto precedente
		// wrapper.innerHTML = '';

		//Distruggo il wrapper e lo ricreo ogni volta
		const oldWrapper = document.getElementById('details-wrapper');
		if(oldWrapper) oldWrapper.remove();

		//Creo il wrapper
		const wrapper = document.createElement('div');
		wrapper.id = 'details-wrapper';
		wrapper.className = 'details-wrapper';

		// Aggiungo il wrapper al gioco 
		document.body.appendChild(wrapper);
	
		// Prendi le immagini dalla scena
		const images = SCENE_IMAGES[typeOfItems];
		
		if (!images) {
			console.warn(`Nessuna immagine per la scena: ${typeOfItems}`);
			return;
		}
		
		if(typeOfItems === "contrattazione" || typeOfItems === "accettazione" || typeOfItems === "accettazione_porta"){
			// Gestore unico per tap/click sui layer di immagini della scena.
			const handleTap = (point) => {
				// Prendiamo tutte le immagini clickabili
				const clickableImages = wrapper.querySelectorAll('.clickable-object');

				// Controlla le immagini dalla superiore all'inferiore nel DOM
				const imagesArray = Array.from(clickableImages).reverse();

				for (const img of imagesArray) {
					if (!isClickOnVisiblePixel(img, point)) continue;

					const imgData = images.find(i => i.id === img.id);
					if (!imgData) break;

					this.lockContrattazioneObject(img, imgData);
					break;
				}
			};

			// Touch: usiamo 'touchend' (non 'click') perché su mobile serve
			// preventDefault() per sopprimere il click sintetico successivo.
			// Su touchend le touches attive sono già vuote: si usa changedTouches.
			wrapper.addEventListener('touchend', (e) => {
				e.stopPropagation();
				e.preventDefault();

				const touch = e.changedTouches[0];
				if (!touch) return;
				handleTap({ clientX: touch.clientX, clientY: touch.clientY });
			});

			// Mouse/desktop: il preventDefault sul touchend sopprime il click
			// sintetico, quindi questo listener scatta solo con un mouse reale.
			wrapper.addEventListener('click', (e) => {
				e.stopPropagation();
				handleTap({ clientX: e.clientX, clientY: e.clientY });
			});
		}

		if(images.some(img => img.lighted)) this.bindHoverEvents(wrapper, images);
		
		function loadImage(imgData, wrapper){
			return new Promise((resolve) => {
				const img = document.createElement('img');
				img.id = imgData.id;
				img.src = imgData.src;
				img.className = 'wrapper-item';
				img.style.pointerEvents = 'none';

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

				if(imgData.lighted)
					//Attributo data per identificarli
					img.dataset.lighted = 'true';

				if(imgData.isVisible)
					img.classList.add('hide');
								
				img.onload = () => {
					wrapper.appendChild(img);

					// Cross-fade del lampeggio: copia dell'immagine con il glow
					// "acceso" statico, subito dopo la base (il CSS .highlight + .glow-clone
					// la fa pulsare in opacity). Vedi .glow-clone in main.css.
					if (imgData.onClick) {
						const glow = img.cloneNode();
						glow.removeAttribute('id');
						glow.className = 'wrapper-item glow-clone';
						wrapper.appendChild(glow);
					}

					//Costruisce la mappa alpha subito dopo il caricamento dell'immagine
					if(imgData.lighted)
						buildAlphaMap(img);

					// console.log(img);
					resolve();
				};
				
				img.onerror = () => {
					console.error(`Failed to load: ${imgData.src}`);
					resolve(); // Resolve comunque per far caricare le altre immagini
				};
			});
		}

		// Carica le immagini
		for (const imgData of images) {
			await loadImage(imgData, wrapper);
		}

		// Contatore progresso: solo per le scene con più oggetti da trovare
		// (accettazione_porta ha un solo elemento di transizione, niente contatore).
		if (["torcia", "contrattazione", "accettazione"].includes(typeOfItems)) {
			ObjectCounter.show(images.filter(img => img.dialog).length);
		}

		//Pre-calcola le mappe alpha per gli oggetti lighted
	

		// console.log(`Loaded ${images.length} images for ${typeOfItems}`);
	},


	// Il fade lo gestisco a parte
	// revealPreparedScene() {	
	// 	const overlay = document.getElementById("sceneFadeOverlay");

	// 	/*
	// 	Aspetto 2 volte il frame:
	// 	Stato iniziale: Opacity 1, quindi tutto nero
	// 	Stato intermedio: rimuovo l'overlay e do il tempo al browser di far partire l'animazione
	// 	Stato finale: Opacity 0, quindi trasparente

	// 	Tecnica usata spesso per animazioni di questo tipo
	// 	*/ 
	// 	requestAnimationFrame(() => {
	// 		requestAnimationFrame(() => {
	// 			overlay.classList.remove("covering");
	// 		})
	// 	})
	// },

	async loadScene(typeOfScene){
		switch(typeOfScene){
			case "negazione":
				await this.loadSky("giorno_2");
				break;
			case "rabbia":
				await this.loadSky("giorno_2");
				break;
			case "contrattazione":
				await this.loadSky("giorno_2")
				break;
			case "depressione":
				await this.loadSky("nuvolo");
				break;
			case "accettazione_porta":
				await this.loadSky("giorno_2");
				break;
			case "accettazione":
				await this.loadSky("giorno_1");
				break;
			case "torcia":
				await this.loadSky("notte");	
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
					const torch = document.getElementById('night-overlay');
					if(torch){
						this.lockItemWrapper(wrapper);
					}

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
		let sky = document.getElementById('sky');

		if(wrapper)
			document.body.removeChild(wrapper);

		if(sky)
			sky.innerHTML = ``;

		ObjectCounter.hide();
	},

	addShadow(){
		let wrapper = document.getElementById('details-wrapper');
		if(!wrapper) return;

		const imges = SCENE_IMAGES["depressione"];
		const imgWrapper = wrapper.querySelector('.clickable-object');
		// console.log(imgWrapper);
		imgWrapper.classList.remove('hide');

		wrapper.addEventListener('click', (e) => {
			e.stopPropagation();

			const img = imges.find(i => i.id === imgWrapper.id);

			const point = {clientX: e.clientX, clientY: e.clientY};
			if (isClickOnVisiblePixel(imgWrapper, point)) {
				
				if (img && img.onClick) {
					imgWrapper.classList.remove('clickable-object', 'highlight');
					imgWrapper.style.pointerEvents = 'none';
					this.lockItemWrapper(wrapper);
				}
			}
		});
	},

	bindHoverEvents(wrapper, images){
		let rafId = null;
		let lastPoint = null;

		const processHover = (point) => {
			// Funziona solo se la torcia è attiva e non è freezata
			if (!NightOverlay.element?.classList.contains('torch')) return;
        	if (NightOverlay.isFrozen) return;	

			// Filtra solo gli oggetti con proprietà lighted
			const lightedImages = images.filter(img => img.lighted);

			// Prende gli elementi DOM in ordine inverso (ultimo aggiunto = più in alto)
			const elements = Array.from(wrapper.querySelectorAll('[data-lighted="true"]')).reverse();

			// Cerca il primo oggetto il cui pixel sotto il cursore non è trasparente
			let found = null;
			for (const el of elements) {
				const imgData = lightedImages.find(i => i.id === el.id);
				if (!imgData) continue;

				if (isClickOnVisiblePixel(el, point)) {
					found = { element: el, data: imgData };
					break;
				}
			}
			
			// Se non sei su nessun oggetto valido, pulisci e esci
			if (!found) {
				this.clearHover();
				return;
			}
		
			// Se sei su un oggetto diverso da prima, resetta il timer
			if (this.currentHoveredId !== found.data.id) {
				this.clearHover();
				this.currentHoveredId = found.data.id;
				TorchHint.dismiss();

				// Dopo 600ms di permanenza sullo stesso oggetto, apri il dettaglio
				this.hoverTimer = setTimeout(() => {
					// Muove la torcia e la congela centrando l'oggetto, facendo poi partire il dialogo
					this.lockTorchOnObject(found.element, found.data);
				}, 350);
			}
		};
	
		// Throttle condiviso touch/mouse: al massimo un processHover per frame.
		const queueHover = (clientX, clientY) => {
			lastPoint = { clientX, clientY };

			if(!rafId){
				rafId = requestAnimationFrame(() => {
					rafId = null;
					if (lastPoint) processHover(lastPoint);
				});
			}
		};

		wrapper.addEventListener('touchmove', (e) => {
			//Sempre stesso discorso, solo se torcia attiva
			if (!NightOverlay.element?.classList.contains('torch')) return;
			const touch = e.touches[0];
			if(!touch) return;

			queueHover(touch.clientX, touch.clientY);
		}, {passive: false});

		// Desktop: la torcia segue già il mouse (NightOverlay); qui agganciamo
		// anche l'apertura dei dialoghi quando il fascio resta su un oggetto.
		wrapper.addEventListener('mousemove', (e) => {
			if (!NightOverlay.element?.classList.contains('torch')) return;
			queueHover(e.clientX, e.clientY);
		});

		wrapper.addEventListener('touchend', (e) => {
			if(this.currentHoveredId){
				e.stopPropagation();
			}
		});

		// // Se il cursore esce dal wrapper, pulisci tutto
		// wrapper.addEventListener('mouseleave', () => this.clearHover());
	},

	clearHover() {
		if (this.hoverTimer) {
			clearTimeout(this.hoverTimer);
			this.hoverTimer = null;
		}
		this.currentHoveredId = null;
	},

	lockTorchOnObject(element, imgData){
		// Pulisce il timer hover
		if (this.hoverTimer) {
			clearTimeout(this.hoverTimer);
			this.hoverTimer = null;
		}

		//Per il momento blocco la torcia in posizione, poi capiamo se fattibile lo spostare la torcia
		NightOverlay.isFrozen = true;

		this.lockItemWrapper();

		// //Blocco i touch verso monogatari per evitare di skippare dialoghi involontariamente
		// NightOverlay.element.style.pointerEvents = 'none';


		// // Calcola il centro dell'oggetto
		// const rect = element.getBoundingClientRect();
		// const centerX = rect.left + rect.width / 2;
		// const centerY = rect.top + rect.height / 2;

		// // Sposta la torcia al centro e la blocca
		// NightOverlay.targetX = centerX;
		// NightOverlay.targetY = centerY;
		// NightOverlay.torchX = centerX;
		// NightOverlay.torchY = centerY;
		// NightOverlay.updateTorch(centerX, centerY);
		// NightOverlay.isFrozen = true;

		// Salva l'oggetto cliccato
		const store = monogatari.storage();
		store.lastClickedObject = imgData.id;

		// Aggiunge l'oggetto alla lista dei cliccati
		if (!store.clickedObjects.includes(imgData.id)) {
			store.clickedObjects.push(imgData.id);
			ObjectCounter.increment();
		}

		// Rimuove highlight e interattività dall'oggetto
		// element.classList.remove('clickable-object', 'highlight');
		// element.style.pointerEvents = 'none';

		//Tolgo l'oggetto dalla lista di oggetti puntabili
		element.dataset.lighted = 'false';

		//Blocco monogatari temporaneamente per evitare che gli arrivino click inaspettati
		monogatari.global('block', true);

		// Fa partire il dialogo Monogatari
		// Usa la proprietà 'dialog' dell'oggetto in SCENE_IMAGES
		const dialogLabel = imgData.dialog;
		if (dialogLabel) {
				monogatari.global('block', false);
				monogatari.run(dialogLabel);
		}
	},

	unlockTorch(){
		NightOverlay.isFrozen = false;
		this.currentHoveredId = null;

		// Riattiva i touch sul wrapper
		this.unlockItemWrapper();
	},

	lockContrattazioneObject(element, imgData) {
		const store = monogatari.storage();

		store.lastClickedObject = imgData.id;

		if (!store.clickedObjects.includes(imgData.id)) {
			store.clickedObjects.push(imgData.id);
			ObjectCounter.increment();
		}

		// deferSwap: lo swap dell'immagine non avviene al click ma viene fatto
		// a mano dal label di dialogo (serve per mostrare battute PRIMA del cambio)
		if (imgData.onClick && !imgData.deferSwap) {
			element.src = imgData.onClick;
		}

		element.classList.remove('clickable-object', 'highlight');
		element.style.pointerEvents = 'none';

		this.lockItemWrapper();

		if (imgData.dialog) {
			monogatari.run(imgData.dialog);
		}
	},

	unlockItemWrapper(){
		const wrapper = document.getElementById('details-wrapper');
		if (wrapper) wrapper.style.pointerEvents = 'auto';
	},


	lockItemWrapper(wrapper = document.getElementById('details-wrapper')){ 
		if (wrapper) wrapper.style.pointerEvents = 'none';
	},

	addBlur(duration = 2000) {
    const el = document.getElementById('blur-overlay');
    if (!el) return;
    el.style.transition = `opacity ${duration}ms ease`;
    el.classList.add('visible');
},

	removeBlur(duration = 0) {
		const el = document.getElementById('blur-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.remove('visible');
	},

	addBW(duration = 0) {
		const el = document.getElementById('bw-filter-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.add('visible');
	},

	removeBW(duration = 0) {
		const el = document.getElementById('bw-filter-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.remove('visible');
	},

	addSaturation(duration = 0) {
		const el = document.getElementById('saturation-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.add('visible');
	},

	removeSaturation(duration = 0) {
		const el = document.getElementById('saturation-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.remove('visible');
	},

	addDim(duration = 0){
		const el = document.getElementById('dim-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.add('visible');
	},

	removeDim(duration = 0){
		const el = document.getElementById('dim-overlay');
		if (!el) return;
		el.style.transition = `opacity ${duration}ms ease`;
		el.classList.remove('visible');
	}

}

const SceneFade = {
	element: null,
	defaultDuration: 1.5,
	defaultColor: '#000',

	init() {
		this.element = document.getElementById('sceneFadeOverlay');
	},

	wait(seconds) {
		return new Promise(resolve => {
			setTimeout(resolve, seconds * 1000);
		});
	},

	async toVisible({ duration = this.defaultDuration, color = this.defaultColor } = {}) {
		if (!this.element) this.init();

		this.element.style.background = color;
		this.element.style.transitionDuration = `${duration}s`;

		requestAnimationFrame(() => {
			this.element.style.opacity = '1';
		});

		if(PhoneToggle.visible)
			PhoneToggle.hide();

		await this.wait(duration);
	},

	async toHidden({ duration = this.defaultDuration } = {}) {
		if (!this.element) this.init();

		this.element.style.transitionDuration = `${duration}s`;

		requestAnimationFrame(() => {
			this.element.style.opacity = '0';
		});

		await this.wait(duration);
	}
};


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
		// Solo se il respiro è davvero in corso: evita di lasciare lo stato a
		// 'release' (non-idle) quando il loop non sta girando — es. salto diretto
		// all'intermezzo dal menu debug senza essere passati da start().
		if(this.state === "buildup" || this.state === "plateau"){
			this.state = "release";
		}
	},

	// fadeOut(duration) — spegnimento morbido del respiro di panico.
	// A differenza di stop() (taglio immediato), smette di programmare nuovi
	// respiri ma dissolve a zero il volume dell'audio in corso. Serve per
	// passare al respiro guidato (BreathingGame) senza stacchi netti.
	fadeOut(duration = 1200){
		this.state = "idle";
		clearTimeout(this.timer);

		// Audio mai inizializzato (es. intermezzo raggiunto dal debug senza panico).
		if(!this.inAudio) return;

		const startVol = Math.max(this.inAudio.volume, this.outAudio.volume);
		const t0 = performance.now();

		const tick = (now) => {
			const t = Math.min((now - t0) / duration, 1);
			const v = startVol * (1 - t);
			this.inAudio.volume = v;
			this.outAudio.volume = v;
			if(t < 1){
				requestAnimationFrame(tick);
			} else {
				this.inAudio.pause();
				this.outAudio.pause();
			}
		};
		requestAnimationFrame(tick);
	},

	stop(){
		this.state = "idle";
		clearTimeout(this.timer);
		this.inAudio?.pause();
		this.outAudio?.pause();
	}
}

// =============================================================================
// BreathingGame — minigioco respirazione (scena Intermezzo_Respira)
//
// MECCANICA: un cerchio luminoso al centro guida il giocatore attraverso un
// ciclo di respirazione diaframmatica. Il giocatore deve tenere premuto il
// dito per tutta la durata; il cerchio mostra il ritmo con la sua scala.
//
// CICLO (3 volte, ~39 secondi totali):
//   inspira (4s) → trattieni (2s) → espira (5s) → pausa (2s)
//
// INTEGRAZIONE MONOGATARI: start() restituisce una Promise. Nella scena si
// usa `async () => await BreathingGame.start()` così Monogatari attende il
// completamento prima di procedere con l'azione successiva (jump Torcia).
// =============================================================================
const BreathingGame = {

	// --- STATO ---
	// 'idle'    → il minigioco è spento, nessuna Promise pendente
	// 'running' → ciclo in corso, Monogatari è in attesa
	// 'complete'→ fase di fade-out, la Promise sta per risolversi
	state: 'idle',

	cycle: 0,         // cicli completati dall'inizio del run corrente
	totalCycles: 3,   // numero di cicli prima del completamento
	isHeld: false,    // true quando il giocatore tiene premuto il dito

	// Fase attualmente in esecuzione. Usata in onUp per decidere se il rilascio
	// del dito deve causare un riavvio (solo nelle fasi "attive", non in 'pause').
	currentPhase: 'pause',

	// Scala corrente del cerchio [0.35 – 1.0]. Tenuta aggiornata dal tick di
	// _animateScale() per consentire a _restart() di partire dal punto esatto
	// in cui si trovava il cerchio al momento del rilascio.
	currentScale: 0.35,

	animId: null,          // handle del requestAnimationFrame corrente (per cancellarlo)
	phaseTimer: null,      // handle del setTimeout che segna la fine di ogni fase
	_holdGraceTimer: null, // timeout di grazia per rilevare la mancanza di tocco a inizio fase
	_completeTimer: null,  // timeout del fade-out finale in _complete(); tracciato per poterlo cancellare in stop()
	resolver: null,        // funzione resolve() della Promise restituita da start()

	// --- RIFERIMENTI DOM (inizializzati in init()) ---
	overlay: null,    // #breathing-game   — contenitore principale
	circle:  null,    // #breathing-circle — il cerchio luminoso
	label:   null,    // #breathing-label  — testo "INSPIRA / TRATTIENI / ESPIRA"
	hint:    null,    // .breathing-hint   — "Tieni premuto il dito"

	// --- AUDIO (stessi file usati da PanicBreath, volume più basso) ---
	inAudio:  null,
	outAudio: null,

	// Ordine fisso delle fasi in ogni ciclo
	sequence: ['inhale', 'hold-in', 'exhale', 'pause'],

	// Durata di ciascuna fase in millisecondi
	durations: {
		'inhale':  4000,  // il cerchio cresce lentamente
		'hold-in': 2000,  // il cerchio resta grande
		'exhale':  5000,  // il cerchio si riduce (espirazione più lunga = più calmante)
		'pause':   2000,  // piccola pausa prima del ciclo successivo
	},

	// Testo mostrato sotto il cerchio per ciascuna fase.
	// 'pause' è vuoto: nessuna istruzione, solo silenzio visivo.
	labels: {
		'inhale':  'Inspira',
		'hold-in': 'Trattieni',
		'exhale':  'Espira',
		'pause':   '',
	},

	// Scala CSS del cerchio: 0.35 = contratto (~80px), 1.0 = espanso (~230px)
	scaleMin: 0.35,
	scaleMax: 1.0,


	// -------------------------------------------------------------------------
	// init() — aggancia gli elementi DOM e prepara gli audio.
	// Chiamato la prima volta da start(); sicuro da chiamare più volte
	// perché gli Audio vengono creati una sola volta.
	// -------------------------------------------------------------------------
	init() {
		this.overlay = document.getElementById('breathing-game');
		this.circle  = document.getElementById('breathing-circle');
		this.label   = document.getElementById('breathing-label');
		this.hint    = this.overlay?.querySelector('.breathing-hint');

		if (!this.inAudio) {
			this.inAudio  = new Audio('assets/sounds/breath_in.mp3');
			this.outAudio = new Audio('assets/sounds/breath_out.mp3');
			// Volume ridotto rispetto a PanicBreath (0.55 vs 1.0): il respiro
			// guidato deve essere sottile, non invasivo.
			this.inAudio.volume  = 0.55;
			this.outAudio.volume = 0.55;
		}
	},


	// -------------------------------------------------------------------------
	// start() → Promise
	// Avvia il minigioco e restituisce una Promise che si risolve dopo
	// totalCycles cicli completi. Monogatari attende questa Promise prima
	// di proseguire con l'azione successiva nello script.
	// -------------------------------------------------------------------------
	start() {
		if (!this.overlay) this.init();

		// Se per qualche motivo start() viene chiamato mentre già gira (es.
		// doppio click da debug menu), ignoriamo la seconda chiamata.
		if (this.state !== 'idle') return Promise.resolve();

		// PanicBreath è ancora in fase 'release': non lo tagliamo di netto ma lo
		// dissolviamo dolcemente mentre il cerchio guidato appare, così il
		// passaggio dal respiro affannato a quello calmo non ha alcuno stacco.
		if (PanicBreath.state !== 'idle') PanicBreath.fadeOut(1600);

		this.state = 'running';
		this.cycle = 0;
		this.isHeld = false;
		this.currentPhase = 'pause';
		this.currentScale = this.scaleMin;

		// Resetta il cerchio alla scala minima prima del fade-in, così non
		// appare già espanso durante la transizione di ingresso.
		this.circle.style.transform = `translate(-50%, -50%) scale(${this.scaleMin})`;
		this.label.textContent = '';
		this.label.classList.remove('visible');
		if (this.hint) this.hint.classList.remove('visible');

		// Aggiunge 'visible' che imposta display:block (non ancora opacity:1).
		this.overlay.classList.add('visible');

		return new Promise((resolve) => {
			this.resolver = resolve;

			this._bindInput();

			// DOPPIO requestAnimationFrame: il browser deve prima renderizzare
			// il display:block (primo frame) prima di poter animare l'opacity
			// (secondo frame). Senza questo trick la transizione CSS non parte.
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					this.overlay.classList.add('fade-in'); // → opacity: 1
				});
			});

			// L'hint appare ~1.1s dopo il fade-in, quando il respiro di panico si
			// è ormai dissolto e l'overlay è pienamente visibile.
			setTimeout(() => {
				if (this.hint && this.state === 'running') this.hint.classList.add('visible');
			}, 1100);

			// Pausa di calma prima del primo ciclo: lascia spegnere del tutto il
			// panico, fa apparire l'hint e dà al giocatore il tempo di orientarsi
			// prima che il cerchio inizi a muoversi.
			this.phaseTimer = setTimeout(() => this._startPhase(0), 2400);
		});
	},


	// -------------------------------------------------------------------------
	// _startPhase(index) — avvia la fase n-esima della sequenza corrente.
	// Imposta label + animazione + audio, poi schedula la fase successiva
	// al termine della durata. Quando torna all'indice 0, incrementa il
	// contatore dei cicli e controlla se il gioco è finito.
	//
	// MECCANICA TOCCO PER FASE:
	//   inhale / hold-in → dito PREMUTO; se si alza → restart (onUp in _bindInput)
	//   exhale           → dito ALZATO;  se si preme → restart (onDown in _bindInput)
	//   pause            → nessun vincolo
	//
	// I timer di grazia gestiscono la transizione: all'inizio di ogni fase attiva
	// il giocatore ha 1 secondo per adeguarsi allo stato richiesto.
	// -------------------------------------------------------------------------
	_startPhase(index) {
		if (this.state !== 'running') return;

		const phase    = this.sequence[index];
		const duration = this.durations[phase];

		// Aggiorna la fase corrente: usata da onUp/onDown per decidere se
		// il tocco corrente è corretto o deve causare un riavvio.
		this.currentPhase = phase;

		clearTimeout(this._holdGraceTimer);

		if (phase === 'inhale' || phase === 'hold-in') {
			// Fase PREMUTA: il giocatore deve tenere il dito giù.
			// Se non sta premendo, ha 1 secondo di grazia per farlo.
			if (!this.isHeld) {
				this._holdGraceTimer = setTimeout(() => {
					if (this.state === 'running' && !this.isHeld && (this.currentPhase === 'inhale' || this.currentPhase === 'hold-in')) {
						this._restart();
					}
				}, 1000);
			}
		} else if (phase === 'exhale') {
			// Fase RILASCIATA: il giocatore deve alzare il dito.
			// Se sta ancora premendo (transizione da hold-in), ha 1 secondo per rilasciare.
			if (this.isHeld) {
				this._holdGraceTimer = setTimeout(() => {
					if (this.state === 'running' && this.isHeld && this.currentPhase === 'exhale') {
						this._restart();
					}
				}, 1000);
			}
		}

		this._setLabel(phase);

		// Aggiorna l'hint in base alla fase:
		//   inhale  → "Tieni premuto il dito" (visibile solo se il dito è già alzato)
		//   exhale  → "Alza il dito"          (sempre visibile: ricorda l'azione opposta)
		//   hold-in, pause → nessun suggerimento, l'hint sparisce
		if (this.hint) {
			if (phase === 'inhale') {
				this.hint.textContent = 'Tieni premuto il dito';
				if (!this.isHeld) this.hint.classList.add('visible');
			} else if (phase === 'exhale') {
				this.hint.textContent = 'Alza il dito';
				this.hint.classList.add('visible');
			} else {
				this.hint.classList.remove('visible');
			}
		}

		this._animateScale(phase, duration);
		this._playAudio(phase);

		this.phaseTimer = setTimeout(() => {
			clearTimeout(this._holdGraceTimer);
			const nextIndex = (index + 1) % this.sequence.length;

			// nextIndex === 0 significa che abbiamo completato un ciclo intero
			if (nextIndex === 0) {
				this.cycle++;
				if (this.cycle >= this.totalCycles) {
					this._complete();
					return;
				}
			}

			this._startPhase(nextIndex);
		}, duration);
	},


	// -------------------------------------------------------------------------
	// _animateScale(phase, duration) — anima la scala del cerchio con rAF.
	// Usa un'easing sinusoidale (ease-in-out sine) per movimenti morbidi
	// che ricordano il respiro reale (lento all'inizio e alla fine della fase).
	//
	// Mappatura scala:
	//   inhale   → scaleMin → scaleMax  (cresce)
	//   hold-in  → scaleMax → scaleMax  (fermo grande)
	//   exhale   → scaleMax → scaleMin  (si riduce)
	//   pause    → scaleMin → scaleMin  (fermo piccolo)
	// -------------------------------------------------------------------------
	_animateScale(phase, duration) {
		// Cancella l'animazione precedente prima di avviarne una nuova
		if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }

		const t0 = performance.now();

		// La logica del from/to si legge così:
		//   le fasi che "partono piccole" sono inhale e pause → fromScale = min
		//   le fasi che "arrivano piccole" sono exhale e pause → toScale = min
		const fromScale = (phase === 'inhale' || phase === 'pause') ? this.scaleMin : this.scaleMax;
		const toScale   = (phase === 'exhale' || phase === 'pause') ? this.scaleMin : this.scaleMax;

		const tick = (now) => {
			if (this.state !== 'running') return;

			// t è il progresso normalizzato [0, 1] della fase corrente
			const t = Math.min((now - t0) / duration, 1);

			// Formula ease-in-out sine: -(cos(πt) - 1) / 2
			// Produce una curva S che rallenta all'inizio e alla fine,
			// rendendo il respiro fluido e non meccanico.
			const e = -(Math.cos(Math.PI * t) - 1) / 2;

			const scale = fromScale + (toScale - fromScale) * e;

			// Teniamo traccia della scala corrente: _restart() ne ha bisogno per
			// animare il cerchio dal punto esatto in cui si trova al momento del fail.
			this.currentScale = scale;
			this.circle.style.transform = `translate(-50%, -50%) scale(${scale})`;

			if (t < 1) this.animId = requestAnimationFrame(tick);
		};

		this.animId = requestAnimationFrame(tick);
	},


	// -------------------------------------------------------------------------
	// _setLabel(phase) — aggiorna il testo della label con un crossfade.
	// Prima fa sparire la label (rimuovendo 'visible'), poi dopo 160ms
	// cambia il testo e la rende di nuovo visibile. Il delay corrisponde
	// alla metà della transizione opacity (0.45s → 225ms) così il testo
	// cambia quando è quasi invisibile, evitando un salto brusco.
	// -------------------------------------------------------------------------
	_setLabel(phase) {
		const text = this.labels[phase];

		this.label.classList.remove('visible'); // fade-out

		setTimeout(() => {
			if (this.state !== 'running') return;
			this.label.textContent = text || '';
			if (text) this.label.classList.add('visible'); // fade-in
		}, 160);
	},


	// -------------------------------------------------------------------------
	// _playAudio(phase) — riproduce il suono del respiro associato alla fase.
	// Usa gli stessi file audio di PanicBreath ma a volume ridotto.
	// Le fasi hold-in e pause non hanno audio: il silenzio è intenzionale.
	// Il .catch(() => {}) evita errori non gestiti se il browser blocca
	// l'autoplay (per policy mobile/desktop).
	// -------------------------------------------------------------------------
	_playAudio(phase) {
		if (phase === 'inhale') {
			this.inAudio.currentTime = 0;
			this.inAudio.play().catch(() => {});
		} else if (phase === 'exhale') {
			this.outAudio.currentTime = 0;
			this.outAudio.play().catch(() => {});
		}
	},


	// -------------------------------------------------------------------------
	// _bindInput() — ascolta touch e click; applica la logica di riavvio
	// in base alla fase corrente.
	//
	// REGOLE:
	//   onDown durante 'inhale'/'hold-in' → OK (cancella timer di grazia)
	//   onDown durante 'exhale'           → ERRORE → restart immediato
	//   onUp   durante 'inhale'/'hold-in' → ERRORE → restart immediato
	//   onUp   durante 'exhale'           → OK (annulla timer di grazia)
	//   onUp/onDown durante 'pause'       → ignorato
	//
	// NOTA: touchstart usa { passive: false } perché chiamiamo preventDefault()
	// per evitare che il browser mobile generi un click sintetico in ritardo.
	// -------------------------------------------------------------------------
	_bindInput() {
		const onDown = (e) => {
			e.preventDefault();

			if (this.state === 'running' && this.currentPhase === 'exhale') {
				// Premuto durante l'espirazione: azione sbagliata → ricomincia.
				this.isHeld = true;
				this.overlay.classList.add('held');
				this._restart();
				return;
			}

			this.isHeld = true;
			this.overlay.classList.add('held');
			if (this.hint) this.hint.classList.remove('visible');
			// Annulla il timer di grazia "non stai premendo": il giocatore ha premuto
			// in tempo, quindi non serve riavviare.
			clearTimeout(this._holdGraceTimer);
		};

		const onUp = () => {
			const wasHeld = this.isHeld;
			this.isHeld = false;
			this.overlay.classList.remove('held');

			if (!wasHeld || this.state !== 'running') return;

			if (this.currentPhase === 'inhale' || this.currentPhase === 'hold-in') {
				// Rilasciato durante una fase che richiede il tocco → ricomincia.
				this._restart();
			} else if (this.currentPhase === 'exhale') {
				// Rilasciato durante l'espirazione: azione corretta.
				// Annulla il timer di grazia "stai ancora premendo".
				clearTimeout(this._holdGraceTimer);
				// Nasconde l'hint "Alza il dito": il giocatore ha già obbedito.
				if (this.hint) this.hint.classList.remove('visible');
			}
		};

		this.overlay.addEventListener('mousedown',  onDown);
		this.overlay.addEventListener('touchstart', onDown, { passive: false });
		this.overlay.addEventListener('mouseup',    onUp);
		this.overlay.addEventListener('touchend',   onUp);
		// mouseleave gestisce il caso in cui il cursore esca dall'overlay
		// senza rilasciare il bottone (es. finestra resize durante il gioco)
		this.overlay.addEventListener('mouseleave', onUp);

		// Salviamo la funzione di rimozione listener come proprietà dell'oggetto
		// così _complete() e stop() possono chiamarla senza tenere riferimenti esterni.
		this._cleanupInput = () => {
			this.overlay.removeEventListener('mousedown',  onDown);
			this.overlay.removeEventListener('touchstart', onDown);
			this.overlay.removeEventListener('mouseup',    onUp);
			this.overlay.removeEventListener('touchend',   onUp);
			this.overlay.removeEventListener('mouseleave', onUp);
		};
	},


	// -------------------------------------------------------------------------
	// _restart() — riavvia il ciclo da capo dopo un errore del giocatore.
	//
	// Viene chiamato quando:
	//   a) rilascio durante inhale/hold-in  → dito alzato quando doveva essere giù
	//   b) pressione durante exhale         → dito giù quando doveva essere alzato
	//   c) timer di grazia scaduto          → giocatore non si è adeguato in tempo
	//
	// SEQUENZA VISIVA:
	//   1. Il cerchio si ritrae dolcemente alla scala minima (700ms), partendo
	//      dal punto esatto in cui si trovava grazie a this.currentScale.
	//   2. Pausa silenziosa di 1.5s con l'hint visibile.
	//   3. Riparte _startPhase(0) con cycle = 0.
	// -------------------------------------------------------------------------
	_restart() {
		clearTimeout(this.phaseTimer);
		clearTimeout(this._holdGraceTimer);
		if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }

		this.cycle = 0;
		this.currentPhase = 'pause';

		// Resetta lo stato del tocco: ogni nuovo ciclo ricomincia da zero,
		// il giocatore deve premere esplicitamente per la nuova 'inhale'.
		this.isHeld = false;
		this.overlay.classList.remove('held');

		this.label.classList.remove('visible');

		// Ri-mostra l'hint come promemoria (testo resettato a "inhale")
		if (this.hint) {
			this.hint.textContent = 'Tieni premuto il dito';
			this.hint.classList.add('visible');
		}

		// Animazione di rientro: dal punto corrente → scaleMin in 700ms
		const fromScale = this.currentScale;
		const t0 = performance.now();
		const shrinkDuration = 700;

		const shrink = (now) => {
			if (this.state !== 'running') return;
			const t = Math.min((now - t0) / shrinkDuration, 1);
			const e = -(Math.cos(Math.PI * t) - 1) / 2;
			const scale = fromScale + (this.scaleMin - fromScale) * e;
			this.currentScale = scale;
			this.circle.style.transform = `translate(-50%, -50%) scale(${scale})`;
			if (t < 1) {
				this.animId = requestAnimationFrame(shrink);
			} else {
				this.animId = null;
				this.currentScale = this.scaleMin;
			}
		};

		this.animId = requestAnimationFrame(shrink);

		// Dopo la contrazione + pausa di orientamento, ricomincia il primo ciclo
		this.phaseTimer = setTimeout(() => {
			if (this.state !== 'running') return;
			this._startPhase(0);
		}, shrinkDuration + 1500);
	},


	// -------------------------------------------------------------------------
	// _complete() — chiamato dopo totalCycles cicli riusciti.
	// Fa un fade-out dell'overlay (1.2s), poi risolve la Promise di Monogatari
	// così lo script può proseguire con 'jump Torcia'.
	// -------------------------------------------------------------------------
	_complete() {
		this.state = 'complete';
		clearTimeout(this.phaseTimer);
		clearTimeout(this._holdGraceTimer);
		if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
		this._cleanupInput?.();

		// Nasconde label e hint prima del fade-out dell'overlay
		this.label.classList.remove('visible');
		if (this.hint) this.hint.classList.remove('visible');

		// Rimuovere 'fade-in' trigghera la transizione CSS opacity → 0
		this.overlay.classList.remove('fade-in');

		// Aspettiamo che la transizione finisca (1.1s definita in CSS + margine)
		// prima di nascondere completamente l'overlay e risolvere la Promise.
		// Il timer è tracciato in _completeTimer così stop() può cancellarlo
		// se il debug menu salta scena durante il fade-out.
		this._completeTimer = setTimeout(() => {
			this._completeTimer = null;
			this.overlay.classList.remove('visible', 'held');
			this.state = 'idle';
			const resolve = this.resolver;
			this.resolver = null;
			resolve?.(); // Monogatari può ora andare avanti (jump Torcia)
		}, 1200);
	},


	// -------------------------------------------------------------------------
	// stop() — interruzione forzata (es. salto da debug menu o cambio scena).
	// A differenza di _complete(), non aspetta la transizione: rimuove tutto
	// immediatamente e risolve la Promise pendente, così Monogatari non rimane
	// bloccato ad aspettare un minigioco che non finirà mai.
	// -------------------------------------------------------------------------
	stop() {
		if (this.state === 'idle') return;

		clearTimeout(this.phaseTimer);
		clearTimeout(this._holdGraceTimer);
		clearTimeout(this._completeTimer);   // annulla il fade-out se _complete() era in corso
		this._completeTimer = null;
		if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
		this._cleanupInput?.();
		this.inAudio?.pause();
		this.outAudio?.pause();

		if (this.overlay) this.overlay.classList.remove('visible', 'fade-in', 'held');
		if (this.label)   this.label.classList.remove('visible');
		if (this.hint)    this.hint.classList.remove('visible');

		// Risolviamo la Promise prima di azzerare il resolver, altrimenti
		// Monogatari rimarrebbe bloccato sull'await di start().
		const resolve = this.resolver;
		this.resolver = null;
		this.state = 'idle';
		resolve?.();
	},
};


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
	},

	async closeLid(speed = this.speed){
		if (this.isBlinkning) return;

		this.isBlinkning = true;

		try{
			this.setSpeed(speed);
			
			const overlay = this.getOverlay();

			overlay.classList.add('closed');
		} finally {
			this.isBlinkning = false;
		}
	},

	async openLid(speed = this.speed){
		if (this.isBlinkning) return;

		this.isBlinkning = true;

		try{
			this.setSpeed(speed);

			const overlay = this.getOverlay();

			overlay.classList.remove('closed');
		} finally {
			this.isBlinkning = false;
		}
	} 
}

function startAcceleratingClock(options = {}) {
	return new Promise((resolve) => {
		// Overlay + cielo notte: singolo punto di controllo per entrambi i layer
		const DayCycle = (() => {
			let overlayEl = null;
			let skyEl = null;

			function init() {
				overlayEl = document.createElement('div');
				overlayEl.className = 'daycycle-layer';
				document.body.appendChild(overlayEl);

				skyEl = document.createElement('div');
				skyEl.className = 'sky-night';
				skyEl.style.backgroundImage = 'url("assets/scenes/cielo_notte.png")'; // path fisso, una volta sola
				document.body.appendChild(skyEl);
			}

			function set(isNight) {
				if (!overlayEl) init();
				overlayEl.classList.toggle('active', isNight);
				skyEl.classList.toggle('active', isNight);
			}

			return { set };
		})();

		// rampMs: durata dell'accelerazione iniziale. plateauMs: durata nominale a velocità costante.
		// speedPerMs: minuti simulati per ms reale a regime (hardcoded, unica fonte di velocità).
		const { rampMs = 3000, plateauMs = 6000 } = options;
		const speedPerMs = 1.3;

		const timeEl = document.getElementById('lock-time');
		const dateEl = document.getElementById('phone-lock-date');

		PhoneUI.stopClock(); // sospende il clock reale per non farlo litigare col nostro rendering

		const WEEKDAYS = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
		const isNight = (h) => h < 7 || h > 20;

		let current = new Date();
		let dayIndex = current.getDay();
		let wasNight = isNight(current.getHours());
		let frameId, lastTs, elapsed = 0, stopping = false;

		function render() {
			timeEl.textContent = `${String(current.getHours()).padStart(2,'0')}:${String(current.getMinutes()).padStart(2,'0')}`;

			const nightNow = isNight(current.getHours());
			if (wasNight && !nightNow) dayIndex = (dayIndex + 1) % 7; // avanza il giorno solo al varco notte->giorno
			wasNight = nightNow;

			dateEl.textContent = WEEKDAYS[dayIndex];
			DayCycle.set(nightNow);
		}

		timeEl.classList.add('clock-glitch'); // solo effetto CSS (blur/flicker): il tempo resta lineare, niente salti random

		function loop(ts) {
			if (lastTs === undefined) lastTs = ts;
			const dt = ts - lastTs;
			lastTs = ts;
			elapsed += dt;

			// Velocità: ease-in quadratico durante il ramp, poi costante (plateau + eventuale extra)
			const rampProgress = Math.min(1, elapsed / rampMs);
			const speed = speedPerMs * rampProgress * rampProgress;

			current = new Date(current.getTime() + speed * dt * 60000);
			render();

			// Oltre il plateau nominale: si ferma solo se è giorno, altrimenti continua un altro giro
			const pastPlateau = elapsed >= rampMs + plateauMs;
			if (pastPlateau && !isNight(current.getHours())) {
				stopping = true;
				timeEl.classList.remove('clock-glitch');
				PhoneUI.startClock();
				resolve(); // taglio secco, nessun cooldown
				return;
			}

			frameId = requestAnimationFrame(loop);
		};

		frameId = requestAnimationFrame(loop);
	});
}
	


const AudioManager = {
	//Dizionario delle tracce audio già create, indicizzato per ID
	tracks: {},

	//Unico contesto audio per l'intera applicazione
	context: null,

	// Filtro passa-basso condiviso (collegato tra gain e destination)
	lowPassFilter: null,

	// Frequenza massima = filtro trasparente	(bypass effettivo)
	LOWPASS_BYPASS_FREQ: 20000,

	//Mappa degli audio
	assets: {
		rage: 'assets/music/mus_rabbia_loop.mp3',
		rain: 'assets/music/rain.mp3',
		depression: 'assets/music/mus_depressione_loop.mp3',
		acceptance: 'assets/music/mus_accettazione_loop.mp3',
		crash: 'assets/sounds/sfx_incidente.mp3',
		crash_short: 'assets/sounds/crash.mp3',
		phone_vibration: 'assets/sounds/phone_vibration.mp3',
		phone_notification: 'assets/sounds/phone_notification.mp3',
		ambience: 'assets/sounds/sfx_ambience.mp3',
		whistle: 'assets/sounds/sfx_whistle_loop.mp3',
		birds: 'assets/sounds/sfx_respiro_uccellini.mp3',
		fan: 'assets/sounds/sfx_ventola_loop.mp3',
		glitch: 'assets/sounds/glitch.mp3',
		cry: 'assets/sounds/cry.mp3',
	},

	//Restituisce il context, creandolo alla prima esecuzione
	getContext() {
		if (!this.context) {
			this.context = new AudioContext();
		}

		return this.context;
	},

	/**
	 * Restituisce (o crea) il filtro passa-basso condiviso.
	 * Collegato una volta sola nella catena: gain → filter → destination.
	 * Inizializzato a 20kHz = trasparente, così le tracce suonano normali
	 * finché non si chiama setLowPass().
	 */
	getLowPassFilter() {
		if (!this.lowPassFilter) {
			const ctx = this.getContext();
			
			this.lowPassFilter = ctx.createBiquadFilter();
			this.lowPassFilter.type = 'lowpass';
			this.lowPassFilter.frequency.value = this.LOWPASS_BYPASS_FREQ;
			this.lowPassFilter.Q.value = 0; // nessuna risonanza
			
			// Lo inserisce tra gain e destination
			this.lowPassFilter.connect(ctx.destination);
		}
		
		return this.lowPassFilter;
	},


	/** 
	* Converte un valore di volume in un guadagno lineare per il GainNode.
	* - Se non è un numero finito, restituisce 1 (100%)
	* - Se >1, lo interpreta come percentuale (es. 80 -> 0.8)
	* - Altrimenti lo usa direttamente come fattore (es. 0.5)
	*/
	getVolume(value = 1) {
		const volume = Number(value);
		if (!Number.isFinite(volume)) return 1;

		return volume > 1 ? volume / 100 : volume;
	},

	/**
	 * Crea un nuovo elemento Audio, lo collega all'AudioContext tramite MediaElementSource e un GainNode, e salva la traccia
	 * NB: createMediaElementSource può essere usato una sola volta per traccia, per questo l'array tracks{}
	 */
	createTrack(id) {
		const audio = new Audio(this.assets[id] || id);
		const context = this.getContext();

		const source = context.createMediaElementSource(audio);
		const gain = context.createGain();
		const filter = this.getLowPassFilter();	

		source.connect(gain);
		gain.connect(filter);

		this.tracks[id] = {
			audio,
			source,
			gain,
			fade: null
		};

		return this.tracks[id];
	},
	/**
	 * Restituisce o crea la traccia con l'ID indicato
	 */
	getTrack(id) {
		return this.tracks[id] || this.createTrack(id);
	},

	/**
	 * Avvia la riproduzione di una traccia con opzioni di volume, fade-in e loop.
	 * Se l'AudioContext è sospeso (politiche di autoplay), lo riattiva prima.
	 * @param {string} id - Identificativo del suono.
	 * @param {Object} options - Opzioni: volume, fade, loop.
	 */
	async play(id, options = {}) {
		const track = this.getTrack(id);
		const context = this.getContext();

		if (context.state === 'suspended') {
			await context.resume();
		}

		const volume = this.getVolume(options.volume ?? 1);
		const fade = options.fade ?? 0;

		// Imposta il loop solo se passato esplicitamente, così una ripresa
		// con play(id) senza opzioni preserva il loop impostato in precedenza
		if ('loop' in options) {
			track.audio.loop = options.loop;
		}

		if ('glitch' in options){
			this.applyGlitch(track, options.glitchDuration ?? 5, options.glitch);
		}

		if (fade > 0) {
			track.gain.gain.setValueAtTime(0, context.currentTime);
			track.gain.gain.linearRampToValueAtTime(volume, context.currentTime + fade);
		} else {
			track.gain.gain.setValueAtTime(volume, context.currentTime);
		}

		await track.audio.play();
	},

	/**
	 * Mette in pausa la traccia (il currentTime non viene azzerato).
	 */
	pause(id) {
		const track = this.tracks[id];
		if (!track) return;

		track.audio.pause();
	},

	/**
	 * Ferma immediatamente la traccia: pausa e reset del tempo a 0.
	 */
	stop(id) {
		const track = this.tracks[id];
		if (!track) return;

		track.audio.pause();
		track.audio.currentTime = 0;
	},

	/**
	 * Ferma tutte le tracce attive. Usato dal debug menu prima di un salto
	 * di scena per non lasciare musiche/loop della scena precedente.
	 */
	stopAll() {
		Object.keys(this.tracks).forEach((id) => this.stop(id));
	},

	/**
	 * Sfuma la traccia fino a 0 in un tempo dato, poi la ferma.
	 * Restituisce una Promise che si risolve al termine del fade-out.
	 * Usa setTimeout, non perfettamente sincrono con l'AudioContext,
	 * ma sufficiente per molti casi pratici.
	 */
	fadeOut(id, duration = 1.5) {
		const track = this.tracks[id];
		if (!track) return Promise.resolve();

		const context = this.getContext();

		// Annulla rampe precedenti e congela il valore corrente
		track.gain.gain.cancelScheduledValues(context.currentTime);
		track.gain.gain.setValueAtTime(track.gain.gain.value, context.currentTime);

		// Rampa lineare fino a 0
		track.gain.gain.linearRampToValueAtTime(0, context.currentTime + duration);

		return new Promise(resolve => {
			setTimeout(() => {
				this.stop(id);
				resolve();
			}, duration * 1000);
		});
	},

	waitEnded(id){
		const track = this.tracks[id];
		if(!track) return Promise.resolve();

		return new Promise(resolve => {
			track.audio.addEventListener('ended', resolve, {once: true});
		});
	},

	/**
	 * Imposta il volume di una traccia, istantaneamente o con una rampa lineare.
	 * @param {string} id - Identificativo della traccia.
	 * @param {number} volume - Nuovo volume (valore >1 interpretato come percentuale).
	 * @param {number} duration - Durata della rampa in secondi (0 = immediato).
	 */
	setVolume(id, volume, duration = 0) {
		const track = this.getTrack(id);
		const context = this.getContext();
		const value = this.getVolume(volume);

		track.gain.gain.cancelScheduledValues(context.currentTime);

		if (duration > 0) {
			// Rampa lineare dal valore corrente al nuovo volume
			track.gain.gain.setValueAtTime(track.gain.gain.value, context.currentTime);
			track.gain.gain.linearRampToValueAtTime(value, context.currentTime + duration);
		} else {
			track.gain.gain.setValueAtTime(value, context.currentTime);
		}
	},

	/**
	 * Applica il filtro passa-basso a TUTTE le tracce.
	 * @param {number} frequency - Frequenza di taglio in Hz (200-400 = ovattato, 20000 = bypass)
	 * @param {number} rampTime - Tempo della rampa in secondi (default 0.1)
	 * 
	 * Esempi:
	 *   AudioManager.setLowPass(300, 2)   → fade a suono ovattato in 2s
	 *   AudioManager.setLowPass(800, 0.5) → filtra solo gli alti in 0.5s
	 *   AudioManager.setLowPass(20000)    → rimuove il filtro istantaneamente
	 */
	setLowPass(frequency, rampTime = 0.1) {
		const filter = this.getLowPassFilter();
		const ctx = this.getContext();

		console.log('setLowPass called:', {
			frequency,
			rampTime,
			currentFreq: filter.frequency.value,
			filterType: filter.type,
			ctxState: ctx.state,
			numberOfInputs: filter.numberOfInputs,
			numberOfOutputs: filter.numberOfOutputs
    	});

		filter.frequency.setValueAtTime(filter.frequency.value, ctx.currentTime);
		filter.frequency.linearRampToValueAtTime(frequency, ctx.currentTime + rampTime);
		// Debug dopo il set
   		console.log('Frequency set to:', filter.frequency.value);
	},

	applyGlitch(track, duration, options = {}){
		const context = this.context;
		const startTime = context.currentTime;

		if(!track.glitchGain){
			track.glitchGain = context.createGain();
			track.source.disconnect();
			track.source.connect(track.glitchGain);
			track.glitchGain.connect(track.gain);
		}

		const startInterval = options.interval ?? 300;
		const endInterval = options.endInterval ?? 30;
		const maxVol = track.glitchGain.gain.value;

		const glitch = () => {
			const now = context.currentTime;
			const elapsed = now - startTime;
			const t = Math.min(1, elapsed / duration);
			const eased = t * t;
			
			const currentInterval = startInterval + (endInterval - startInterval) * eased;
			

			// Alterna casualmente: silenzio, volume pieno, o volume gracchiante
			const dice = Math.random();
			
			if (dice < 0.4) {
				// Silenzio (durata random tra 20 e 80ms)
				const silenceDuration = 0.02 + Math.random() * 0.06;
				track.glitchGain.gain.linearRampToValueAtTime(0, now + 0.01);
				track.glitchGain.gain.linearRampToValueAtTime(0, now + silenceDuration);
			} else if (dice < 0.75) {
				// Volume pieno ma instabile
				const vol = maxVol * (0.4 + Math.random() * 0.6);
				track.glitchGain.gain.linearRampToValueAtTime(vol, now + 0.02);
				track.glitchGain.gain.linearRampToValueAtTime(vol * (0.5 + Math.random() * 0.5), now + 0.05);
			} else {
				// Scoppio breve di volume pieno
				track.glitchGain.gain.linearRampToValueAtTime(maxVol, now + 0.005);
				track.glitchGain.gain.linearRampToValueAtTime(maxVol * (0.1 + Math.random() * 0.4), now + 0.03);
			}

			track._glitchTimer = setTimeout(glitch, Math.max(10, currentInterval));
		};

		glitch();
	},
};

const HeartbeatManager = {
	// Contesto audio Web Audio API
	context: null,
	// Cache dei buffer audio già decodificati (lub, dub, single)
	buffers: {},
	// Nodo guadagno master per volume globale e fade
	masterGain: null,
	// Timer per il tick dello scheduler
	timer: null,
	// Timestamp AudioContext del prossimo battito da schedulare
	nextBeatTime: 0,
	// BPM attuale (può cambiare gradualmente durante un ramp)
	currentBpm: 60,
	// BPM target verso cui il ramp sta andando
	targetBpm: 60,
	minBpm: 30,
	maxBpm: 220,
	volume: 0.85,
	isPlaying: false,
	isLoading: false,
	// Promise condivisa per non caricare due volte gli asset
	loadPromise: null,
	// Dati del ramp attivo (transizione graduale tra due BPM)
	ramp: null,

	// Percorsi dei tre suoni
	assets: {
		lub: 'assets/sounds/heartbeat_lub.mp3',
		dub: 'assets/sounds/heartbeat_dub.mp3',
		single: 'assets/sounds/heartbeat_single.mp3'
	},

	// Ritardo tra lub e dub in secondi (0.25 = fisiologico)
	dubDelay: 0.25,
	// Quanto tempo nel futuro guarda lo scheduler per pianificare i battiti
	lookAhead: 0.12,
	// Intervallo del timer in millisecondi (25ms = ~40 tick al secondo)
	tickMs: 25,

	// Inizializza l'AudioContext e il nodo master (pigro, al primo utilizzo)
	getContext() {
		if (!this.context) {
			this.context = new AudioContext();
			this.masterGain = this.context.createGain();
			this.masterGain.gain.value = this.volume;
			this.masterGain.connect(this.context.destination);
		}
		return this.context;
	},

	// Forza il BPM entro i limiti min/max
	clampBpm(bpm) {
		const value = Number(bpm);
		if (!Number.isFinite(value)) return this.currentBpm;
		return Math.min(this.maxBpm, Math.max(this.minBpm, value));
	},

	// Normalizza il volume (accetta 0-1 o 0-100)
	getVolume(value = this.volume) {
		const volume = Number(value);
		if (!Number.isFinite(volume)) return this.volume;
		const normalized = volume > 1 ? volume / 100 : volume;
		return Math.min(1, Math.max(0, normalized));
	},

	// Carica e decodifica tutti i file audio in parallelo
	async load() {
		if (this.loadPromise) return this.loadPromise;
		this.isLoading = true;
		this.loadPromise = Promise.all(
			Object.entries(this.assets).map(async ([id, path]) => {
				const response = await fetch(path);
				const data = await response.arrayBuffer();
				this.buffers[id] = await this.getContext().decodeAudioData(data);
			})
		).finally(() => {
			this.isLoading = false;
		});
		return this.loadPromise;
	},

	// Avvia il battito cardiaco
	async start(options = {}) {
		const context = this.getContext();
		await this.load();

		// Riprende l'AudioContext se sospeso (politiche browser)
		if (context.state === 'suspended') {
			await context.resume();
		}

		this.currentBpm = this.clampBpm(options.bpm ?? this.currentBpm);
		this.targetBpm = this.currentBpm;
		this.ramp = null;
		this.dubDelay = Math.max(0.05, Number(options.dubDelay ?? this.dubDelay));
		this.setVolume(options.volume ?? this.volume, options.fadeIn ?? 0);

		this.stopTimer();
		this.isPlaying = true;
		// Primo battito con un piccolo delay per non partire "a secco"
		this.nextBeatTime = context.currentTime + (options.startDelay ?? 0.02);
		this.tick();
		// Loop ogni tickMs per schedulare i battiti in anticipo
		this.timer = setInterval(() => this.tick(), this.tickMs);
	},

	// Ferma il battito, con fadeOut opzionale
	stop(options = {}) {
		if (!this.context || !this.masterGain) {
			this.stopTimer();
			this.isPlaying = false;
			return;
		}

		const fade = Number(options.fade ?? options.fadeOut ?? 0);
		const now = this.context.currentTime;

		this.stopTimer();
		this.isPlaying = false;
		this.ramp = null;

		if (fade > 0) {
			// FadeOut graduale del masterGain
			this.masterGain.gain.cancelScheduledValues(now);
			this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
			this.masterGain.gain.linearRampToValueAtTime(0, now + fade);
			// Ripristina il volume dopo il fade
			setTimeout(() => {
				if (!this.isPlaying) {
					this.masterGain.gain.setValueAtTime(this.volume, this.context.currentTime);
				}
			}, fade * 1000);
			return;
		}

		this.masterGain.gain.cancelScheduledValues(now);
		this.masterGain.gain.setValueAtTime(this.volume, now);
	},

	stopTimer() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	},

	// Scheduler: guarda nel futuro e pianifica i battiti in anticipo
	tick() {
		if (!this.isPlaying || !this.context) return;

		const now = this.context.currentTime;
		// Aggiorna il BPM se c'è un ramp attivo
		this.updateRamp(now);

		// Pianifica tutti i battiti entro la finestra lookAhead
		while (this.nextBeatTime < now + this.lookAhead) {
			this.scheduleBeat(this.nextBeatTime);
			const interval = 60 / this.currentBpm;
			this.nextBeatTime += interval;
			this.updateRamp(this.nextBeatTime);
		}
	},

	// Pianifica un singolo ciclo lub-dub
	scheduleBeat(time) {
		this.playBuffer('lub', time, 1);
		this.playBuffer('dub', time + this.dubDelay, 0.82);
	},

	// Riproduce un buffer audio in un momento preciso
	playBuffer(id, time = null, gain = 1) {
		const buffer = this.buffers[id];
		if (!buffer || !this.context || !this.masterGain) return;

		const source = this.context.createBufferSource();
		const node = this.context.createGain();

		source.buffer = buffer;
		node.gain.value = gain;
		source.connect(node);
		node.connect(this.masterGain);
		source.start(time ?? this.context.currentTime);
	},

	// Riproduce un singolo battito (lub-dub) una volta sola
	async pulse(options = {}) {
		const context = this.getContext();
		await this.load();

		if (context.state === 'suspended') {
			await context.resume();
		}

		this.setVolume(options.volume ?? this.volume);
		this.scheduleBeat(context.currentTime + (options.delay ?? 0));
	},

	// Imposta un nuovo BPM, con transizione graduale opzionale
	setBpm(bpm, options = {}) {
		const nextBpm = this.clampBpm(bpm);
		const duration = Number(options.duration ?? 0);

		if (!this.context || duration <= 0) {
			this.currentBpm = nextBpm;
			this.targetBpm = nextBpm;
			this.ramp = null;
			return;
		}

		const now = this.context.currentTime;
		this.ramp = {
			from: this.currentBpm,
			to: nextBpm,
			start: now,
			end: now + duration
		};
		this.targetBpm = nextBpm;
	},

	// Accelerazione graduale
	accelerate(targetBpm, duration = 4) {
		this.setBpm(targetBpm, { duration });
	},

	// Decelerazione graduale
	decelerate(targetBpm, duration = 4) {
		this.setBpm(targetBpm, { duration });
	},

	// Interpola il BPM durante un ramp (easing smooth)
	updateRamp(time) {
		if (!this.ramp) return;

		if (time >= this.ramp.end) {
			this.currentBpm = this.ramp.to;
			this.ramp = null;
			return;
		}

		const progress = (time - this.ramp.start) / (this.ramp.end - this.ramp.start);
		// Easing smoothstep: inizio lento, centro veloce, fine lento
		const smooth = progress * progress * (3 - 2 * progress);
		this.currentBpm = lerp(this.ramp.from, this.ramp.to, smooth);
	},

	// Imposta il volume, con fade opzionale
	setVolume(volume, duration = 0) {
		const value = this.getVolume(volume);
		this.volume = value;

		if (!this.masterGain || !this.context) return;

		const now = this.context.currentTime;
		this.masterGain.gain.cancelScheduledValues(now);

		if (duration > 0) {
			this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
			this.masterGain.gain.linearRampToValueAtTime(value, now + duration);
		} else {
			this.masterGain.gain.setValueAtTime(value, now);
		}
	}
};

const BWFilter = {
    overlay: null,
    
    // Inizializza - chiamare in init o nel costruttore principale
    init() {
        this.overlay = document.getElementById('bw-filter-overlay');
    },
    
    // Attiva il filtro bianco e nero
    enable(duration = 800) {
        if (!this.overlay) return;
        this.overlay.style.transition = `background-color ${duration}ms ease`;
        this.overlay.classList.add('active');
    },
    
    // Disattiva il filtro
    disable(duration = 800) {
        if (!this.overlay) return;
        this.overlay.style.transition = `background-color ${duration}ms ease`;
        this.overlay.classList.remove('active');
    },
    
    // Attiva/disattiva immediatamente senza transizione
    set(active) {
        if (!this.overlay) return;
        this.overlay.style.transition = 'none';
        active ? this.overlay.classList.add('active') : this.overlay.classList.remove('active');
    }
};

/*OGGETTI CLICKABILI*/
// function showClickableObjects(){
// 	const container = document.createElement("div");
// 	container.id = "clickable-objects";
// 	container.style.position = "absolute";
// 	container.style.top = "0";
// 	container.style.left = "0";
// 	container.style.width = "100%";
// 	container.style.height = "100%";
// 	container.style.pointerEvents = "none"; //gli oggetti stessi avranno pointerEvents

// 	const objects = [
// 		{ id: "obj1", img: "assets/images/placeholder.png", x:"70%", y:"60%", w:"80px"},
// 		{ id: "obj2", img: "assets/images/placeholder.png", x: "20%", y: "50%", w: "100px"}
// 	];

// 	objects.forEach(o => {
// 		const element = document.createElement("img");
// 		element.src = o.img;
// 		element.id = o.id;
// 		element.classList.add('clickable-object');
// 		element.style.position = "absolute";
// 		element.style.left = o.x;
// 		element.style.top = o.y;
// 		element.style.width = o.w;
// 		element.style.pointerEvents = "auto";
// 		element.addEventListener("click", (e) => {
// 			e.stopPropagation(); //NON TOGLIERE, necessario per non far mangiare il click dal global listener di monogatari
// 			monogatari.storage().lastClickedObject = o.id; //Mantengo in memoria l'ultimo oggetto clickato
// 			showDetail(o.id, o.img);
// 		});
// 		container.appendChild(element);
// 	});

// 	document.body.appendChild(container);
// }

// function hideClickableObjects(){
// 	document.getElementById("clickable-objects")?.remove();
// }

// function showDetail(objectId, imageSrc) {
// 	const store = monogatari.storage();
// 	NightOverlay.isFrozen = true;
	
// 	store.lastClickedObject = objectId;
	
// 	// Overlay blur
// 	const blur = document.createElement("div");
// 	blur.id = "detail-blur";
// 	blur.className = "detail-blur";

// 	// Immagine zoommata
// 	const zoom = document.createElement("img");
// 	zoom.id = "detail-zoom";
// 	zoom.className = "detail-zoom";
// 	zoom.src = imageSrc;

// 	// Descrizione
// 	const desc = document.createElement("div");
// 	desc.id = "detail-desc";
// 	desc.className ="detail-desc";
// 	desc.textContent = store.objectDescriptions[objectId];

// 	// Pulsante indietro
// 	const back = document.createElement("div");
// 	back.id = "detail-back";
// 	back.className = "detail-back";
// 	back.innerText = "Chiudi";
// 	back.onclick = () => hideDetail(objectId);

// 	document.body.appendChild(blur);
// 	document.body.appendChild(zoom);
// 	document.body.appendChild(back);
// 	document.body.appendChild(desc);
// }

// function hideDetail(objectId) {	
// 	NightOverlay.isFrozen = false;
// 	const store = monogatari.storage();

// 	if(!store.clickedObjects.includes(objectId)){
// 		store.clickedObjects.push(objectId);
// 	}

// 	document.getElementById("detail-blur")?.remove();
// 	document.getElementById("detail-zoom")?.remove();
// 	document.getElementById("detail-back")?.remove();
// 	document.getElementById("detail-desc")?.remove();

// }

function manageAllClicks(lock){
	if(lock)
		document.documentElement.classList.add('block-all');
	else
		document.documentElement.classList.remove('block-all');
}

// Cache delle mappe di trasparenza per ogni id immagine
const alphaCache = new Map();	//Rimane in memoria ed è disponibile ogni volta che aggiungo nuovi oggetti alla scena

function buildAlphaMap(imgElement) {
    const cacheKey = imgElement.currentSrc || imgElement.src;

	if (alphaCache.has(cacheKey)) {
		return alphaCache.get(cacheKey);
	}

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	const scale = 0.25;

	canvas.width = Math.floor(imgElement.naturalWidth * scale);
	canvas.height = Math.floor(imgElement.naturalHeight * scale);

	ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = new Uint8Array(imageData.data.length / 4);

	for (let i = 0; i < data.length; i++) {
		data[i] = imageData.data[i * 4 + 3];
	}

	const map = {
		width: canvas.width,
		height: canvas.height,
		scale,
		data
	};

	alphaCache.set(cacheKey, map);
	return map;
}


// function isClickOnVisiblePixel(imgElement, point) {
// 	if (!imgElement.naturalWidth || !imgElement.naturalHeight) 
//         return false;
	
// 	const canvas = document.createElement('canvas');
// 	const ctx = canvas.getContext('2d');
	
// 	// Use natural dimensions for accurate pixel sampling
// 	canvas.width = imgElement.naturalWidth;
// 	canvas.height = imgElement.naturalHeight;
	
// 	try {
//         ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
//     } catch (error) {
//         // drawImage fallisce se l'immagine non è completamente decodificata
//         console.warn('drawImage failed, image may not be decoded yet:', imgElement.id);
//         return false;
//     }
	
// 	const rect = imgElement.getBoundingClientRect();
// 	const x = point.clientX - rect.left;
// 	const y = point.clientY - rect.top;
	
// 	// L'immagine è mostrata con object-fit:cover + object-position:center
// 	// (vedi .wrapper-item in main.css): viene scalata di un UNICO fattore e
// 	// centrata, con l'eccedenza ritagliata — NON riempie il box in modo lineare.
// 	// Invertiamo quella trasformazione per campionare il pixel corretto. Con la
// 	// vecchia mappatura "fill" (scaleX/scaleY separati) il tocco colpirebbe il
// 	// pixel sbagliato appena lo schermo non è in proporzione 1440:2560.
// 	const nW = imgElement.naturalWidth;
// 	const nH = imgElement.naturalHeight;
// 	const scale = Math.max(rect.width / nW, rect.height / nH);
// 	const offsetX = (rect.width  - nW * scale) / 2; // ≤ 0: bordi ritagliati
// 	const offsetY = (rect.height - nH * scale) / 2;
// 	const pixelX = Math.floor((x - offsetX) / scale);
// 	const pixelY = Math.floor((y - offsetY) / scale);

// 	 if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) {
// 		// console.warn(x, " ", scaleX, " ", y, " ", scaleY);
// 		// console.log({
// 		// 	id: imgElement.id,
// 		// 	naturalWidth: imgElement.naturalWidth,
// 		// 	naturalHeight: imgElement.naturalHeight,
// 		// 	rectWidth: rect.width,
// 		// 	rectHeight: rect.height,
// 		// 	clientX: event.clientX,
// 		// 	clientY: event.clientY,
// 		// 	rectLeft: rect.left,
// 		// 	rectTop: rect.top,
// 		// 	scaleX,
// 		// 	scaleY,
// 		// 	pixelX,
// 		// 	pixelY
// 		// });
//         return false;
//     }

// 	try {
// 		const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
// 		// console.log('Alpha value:', pixelData[3]);
// 		return pixelData[3] > 0;
// 	} catch (error) {
// 		console.error('Error getting pixel data:', error);
// 		return false;
// 	}
// }

//Per performance, il calcolo lo faccio su una mappa equivalente ma di dimensioni ridotte
function isClickOnVisiblePixel(imgElement, point) {
    if (!imgElement.naturalWidth || !imgElement.naturalHeight) {
		return false;
	}

	const rect = imgElement.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) {
		return false;
	}

	const map = buildAlphaMap(imgElement);

	const x = point.clientX - rect.left;
	const y = point.clientY - rect.top;

	const naturalWidth = imgElement.naturalWidth;
	const naturalHeight = imgElement.naturalHeight;

	const coverScale = Math.max(
		rect.width / naturalWidth,
		rect.height / naturalHeight
	);

	const renderedWidth = naturalWidth * coverScale;
	const renderedHeight = naturalHeight * coverScale;

	const offsetX = (rect.width - renderedWidth) / 2;
	const offsetY = (rect.height - renderedHeight) / 2;

	const naturalX = (x - offsetX) / coverScale;
	const naturalY = (y - offsetY) / coverScale;

	const mapX = Math.floor(naturalX * map.scale);
	const mapY = Math.floor(naturalY * map.scale);

	if (mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) {
		return false;
	}

	return map.data[mapY * map.width + mapX] > 8;
}

/*
TITOLI DI CODA
Overlay nero a schermo intero con scorrimento verticale stile film.
Lanciato dal label 'TitoliDiCoda' a fine accettazione; play() risolve al
click del giocatore dopo la scritta "Fine" (il label passa poi a 'end' → menu),
mentre il nero resta a coprire la transizione e si dissolve da solo.
*/
const EndCredits = {
	// Ruoli e nomi del team: aggiungere/modificare qui.
	roles: [
		{ role: 'Lead', names: 'Gaia Campo' },
		{ role: 'Game Design', names: 'Davide Sarti' },
		{ role: 'Illustrazioni', names: 'Sofia Donisi' },
		{ role: 'Developers', names: 'Gabriele Milano\nGaetano Politi' },
		{ role: 'Sound Designer', names: 'Claudio Bianchi' }
	],

	async play() {
		const overlay = document.createElement('div');
		overlay.id = 'end-credits';

		const roll = document.createElement('div');
		roll.className = 'credits-roll';
		roll.innerHTML =
			'<div class="credits-title">Ciò che resta</div>' +
			this.roles.map(r =>
				`<div class="credit"><div class="credit-role">${r.role}</div><div class="credit-names">${r.names}</div></div>`
			).join('');
		overlay.appendChild(roll);
		document.body.appendChild(overlay);

		const wait = (ms) => new Promise(r => setTimeout(r, ms));
		// Doppio rAF: committa lo stato iniziale prima di animare (stessa
		// tecnica del reveal di scena).
		const nextFrames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

		// Fade a nero
		await nextFrames();
		overlay.classList.add('visible');
		await wait(1500);

		// Scorrimento: il blocco parte sotto lo schermo ed esce dall'alto, velocità fissa ~28ms/px, regolare qui se il rullo è lento/veloce
		const distance = window.innerHeight + roll.offsetHeight;
		const duration = distance * 28;
		roll.style.transition = `transform ${duration}ms linear`;
		roll.style.transform = `translateY(-${distance}px)`;
		await wait(duration + 500);
		roll.remove();

		// "Fine" resta a schermo 10 secondi, poi serve un click per uscire
		const fine = document.createElement('div');
		fine.className = 'credits-fine';
		fine.textContent = 'Fine';
		overlay.appendChild(fine);
		await nextFrames();
		fine.classList.add('visible');
		await wait(10000);

		const hint = document.createElement('div');
		hint.className = 'credits-hint';
		hint.textContent = 'tocca per continuare';
		overlay.appendChild(hint);
		await nextFrames();
		hint.classList.add('visible');
		await new Promise(resolve => {
			overlay.addEventListener('click', resolve, { once: true });
		});

		// Si risolve subito ('end' riporta al menu sotto il nero); l'overlay
		// si dissolve da solo poco dopo, rivelando il menu principale.
		setTimeout(() => {
			overlay.classList.remove('visible');
			setTimeout(() => overlay.remove(), 1600);
		}, 800);
	}
};

/*
DEBUG MENU
Toggle globale del menu di debug, letto da js/debug-config.js (file locale,
in .gitignore). Se il file manca — es. in produzione — il menu resta
disattivato: niente DOM, niente eventi, niente scorciatoia Ctrl/Cmd + Shift + D.
*/
const DEBUG_MENU_ENABLED = window.DEBUG_MENU_ENABLED ?? false;

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
		'Rimani',
		'Intermezzo_Respira',
		'Torcia',
		'Continua_Torcia',
		'Negazione_Cellulare',
		'Rimani_A_Casa',
		'Esci_Casa',
		'Rabbia',
		'GlitchRabbia',
		'ContinuaGlitch',
		'Contrattazione',
		'Continua_Contrattazione',
		'Depressione',
		'Lascia_Andare',
		'Non_Pronto',
		'Accettazione',
		'Scena_Accettazione',
		'TitoliDiCoda',
		//'Test_telefono'
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

	close(persist = true) {
		// Rimuove la classe "open" e aggiorna gli attributi aria.
		this.root.classList.remove('open');
		this.panel.setAttribute('aria-hidden', 'true');
		this.toggleButton.setAttribute('aria-expanded', 'false');

		// Ricorda che lo sviluppatore lo ha chiuso. La chiusura automatica
		// dopo un salto passa persist=false per non toccare la preferenza.
		if (persist) {
			this.setStoredOpenState('0');
		}
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

			// Chiude il pannello per lasciare vedere la scena appena caricata.
			this.close(false);
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

		// Ferma il minigioco respiro se e' attivo.
		if (BreathingGame.state !== 'idle') {
			BreathingGame.stop();
		}

		HeartbeatManager.stop();

		// Ferma il glitch/minigioco se e' attivo; altrimenti pulisce solo WordsGame.
		if (Glitch.active) {
			await Glitch.stop(false);
		} else {
			WordsGame.reset();
		}

		// Ferma tutte le tracce audio delle scene (musiche, loop ambientali)
		// e riporta il filtro passa-basso trasparente, se era stato attivato.
		AudioManager.stopAll();
		if (AudioManager.lowPassFilter) {
			AudioManager.setLowPass(AudioManager.LOWPASS_BYPASS_FREQ, 0);
		}

		// Pulisce il telefono e gli overlay custom prima del salto.
		PhoneUI.hide();
		PhoneUI.reset();
		PhoneTyping.hide();

		// Alcune scene aspettano un messaggio sul telefono senza mostrare il
		// pulsante (nel flusso normale e' gia' visibile dalla scena precedente):
		// saltandoci direttamente va mostrato, altrimenti si resta bloccati.
		const phoneLabels = ['Negazione_Cellulare', 'Rimani_A_Casa', 'Rabbia', 'Depressione'];
		if (phoneLabels.includes(targetLabel)) {
			PhoneToggle.show();
		} else {
			PhoneToggle.hide();
		}

		// Smonta i layer della scena precedente (sky, oggetti) e ripristina lo
		// sfondo standard: ogni label ricrea i propri layer con loadScene.
		SceneUtility.emptyScene();
		SceneUtility.enableBackground();

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
		// hideClickableObjects();
		document.getElementById('detail-blur')?.remove();
		document.getElementById('detail-zoom')?.remove();
		document.getElementById('detail-back')?.remove();
		document.getElementById('detail-desc')?.remove();
	},

	resetVisualOverlays() {
		// WordsGame blocca lo scroll del body: qui lo ripristiniamo.
		document.body.style.overflow = '';

		// Nasconde il contatore oggetti della scena precedente.
		ObjectCounter.hide();

		// Chiude la textbox se un dialogo era a schermo e annulla un eventuale
		// pauseTextBox in corso, che la farebbe riapparire nella scena nuova.
		clearTimeout(pauseTextBoxTimer);
		hideTextBox(false);

		// Spegne i filtri visivi delle transizioni (blur, B/N, saturazione).
		['blur-overlay', 'bw-filter-overlay', 'saturation-overlay'].forEach((id) => {
			document.getElementById(id)?.classList.remove('visible', 'active');
		});

		// Rimuove il layer porta della transizione d'ingresso accettazione.
		document.getElementById('door-layer')?.remove();

		// Rimuove lo zoom inline applicato a game-screen (scena orsacchiotto).
		const gameScreen = document.querySelector('game-screen');
		if (gameScreen) {
			gameScreen.style.transition = '';
			gameScreen.style.transform = '';
		}

		// Rimuove lo zoom d'ingresso accettazione da #sky (elemento persistente,
		// a differenza di #details-wrapper che viene ricreato a ogni loadScene).
		const sky = document.getElementById('sky');
		if (sky) {
			sky.style.transition = '';
			sky.style.transform = '';
		}
		document.body.style.background = '';

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

		// Rimuove overlay del minigioco respiro, se visibile.
		const breathingGame = document.getElementById('breathing-game');
		if (breathingGame) {
			breathingGame.classList.remove('visible', 'fade-in', 'held');
		}

		// Riapre eventuali palpebre chiuse e rimuove il nero di transizione scena.
		document.getElementById('blink-overlay')?.classList.remove('closed');
		const fadeOverlay = document.getElementById('sceneFadeOverlay');
		if (fadeOverlay) fadeOverlay.style.opacity = '0';
	},

	resetStorageFlags(targetLabel = null) {
		const store = monogatari.storage();
		if (!store) return;

		// Stato del minigioco rabbia: riparte sempre dalla fase 1.
		store.glitchGameCompleted = false;
		store.glitchGamePhase = 1;

		// Stato della torcia: nessun dettaglio oggetto rimane selezionato.
		store.lastClickedObject = null;

		// Reset torcia: sia per la scena principale sia per i dialoghi oggetto,
		// in modo che loop_torcia riparta da zero e non avanzi per stato pregresso.
		const isTorciaRelated = targetLabel === null ||
			targetLabel === 'Start' ||
			targetLabel === 'Torcia' ||
			(typeof targetLabel === 'string' && targetLabel.startsWith('DialogoTorcia'));
		if (isTorciaRelated) {
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

function showTextBox(){
	document.body.classList.add('show-textbox');
	document.body.classList.remove('hide-textbox');
	PhoneToggle.hide();
	
	//Blocco i click sull'item wrapper
	SceneUtility.lockItemWrapper();
}

function hideTextBox(phoneVisible = true){
	document.body.classList.add('hide-textbox')
	document.body.classList.remove('show-textbox');

	if(phoneVisible)
		PhoneToggle.show();

	//Sblocco i click sull'item wrapper
	SceneUtility.unlockItemWrapper();
}

// Timer tracciato: il debug menu lo annulla saltando scena, altrimenti la
// textbox riapparirebbe da sola nella scena di destinazione.
let pauseTextBoxTimer = null;

function pauseTextBox(time=3000){
	hideTextBox();
	pauseTextBoxTimer = setTimeout(() => {
		showTextBox();
	}, time);
}
		
$_ready (() => {
	// 2. Inside the $_ready function:

	monogatari.on('start', () => {
		const screens = document.querySelectorAll('game-screen[data-component="game-screen"]');
		console.log("Sono entrato, screens:" + screens);
		if(screens)
			screens.forEach(s => {s.style.backgroundColor = "transparent";});

		// La visibilita' del pulsante telefono e' gestita esplicitamente dalle scene
		// tramite PhoneToggle.show()/.hide().
	})

	monogatari.init ('#monogatari').then (() => {
		// 3. Inside the init function:
		// Il telefono viene inizializzato subito, ma resta nascosto finche una scena lo apre.
		PhoneUI.init();

		// Il toggle e' indipendente dal telefono: decide solo quando mostrare il pulsante e il badge.
		PhoneToggle.init();

		//Cambia automaticamente la classe del body in base al nome dello speaker attivo, per permettere stili dinamici (es. ombra vs tu)
		const speakerClassMap = {
			'Tu': 'speaker-dad',
			'Ombra': 'speaker-shadow'
		};

		const updateSpeakerClass = (speakerName) => {
			const classes = Object.values(speakerClassMap);
			document.body.classList.remove(...classes);

			if (!speakerName || typeof speakerName !== 'string') {
				return;
			}

			const className = speakerClassMap[speakerName.trim()];
			if (className) {
				document.body.classList.add(className);
			}
		};

		const observeSpeakerName = (nameNode) => {
			if (!nameNode) {
				return;
			}

			const observer = new MutationObserver(() => {
				updateSpeakerClass(nameNode.textContent);
			});

			observer.observe(nameNode, {
				characterData: true,
				childList: true,
				subtree: true
			});

			updateSpeakerClass(nameNode.textContent);
		};

		const waitForNameNode = () => {
			const nameNode = document.querySelector('text-box [data-content="name"]');
			if (nameNode) {
				observeSpeakerName(nameNode);
				return;
			}

			const rootObserver = new MutationObserver(() => {
				const node = document.querySelector('text-box [data-content="name"]');
				if (node) {
					rootObserver.disconnect();
					observeSpeakerName(node);
				}
			});

			rootObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
		};

		waitForNameNode();

		// L'icona appare quando il typewriter finisce (skip incluso) e sparisce
		// appena riparte una nuova riga: eventi nativi, niente polling/observer.
		(() => {
			let icon = null;

			const getIcon = () => {
				if (icon) return icon;
				icon = document.createElement('div');
				icon.id = 'dialog-waiting-icon';
				icon.textContent = '▼';
				document.body.appendChild(icon);
				return icon;
			};

			const positionIcon = (textBox) => {
				const rect = textBox.getBoundingClientRect();
				const el = getIcon();
				el.style.left = `${rect.right - 32}px`;
				el.style.top = `${rect.bottom - 30}px`;
			};

			monogatari.on('didFinishTyping', () => {
				const textBox = document.querySelector('text-box');
				if (!textBox) return;
				positionIcon(textBox);
				getIcon().classList.add('visible');
			});

			monogatari.on('didStartTyping', () => {
				getIcon().classList.remove('visible');
			});

			// Nasconde subito l'icona quando la textbox sparisce (classe hide-textbox sul body)
			new MutationObserver(() => {
				if (document.body.classList.contains('hide-textbox')) {
					document.getElementById('dialog-waiting-icon')?.classList.remove('visible');
				}
			}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

		// Il toggle globale evita di creare il menu quando DEBUG_MENU_ENABLED e' false.
		if (DEBUG_MENU_ENABLED) {
			DebugMenu.init();
		}

		// document.getElementById('capture-btn')?.addEventListener('click', captureBuildAsset);

		// async function captureBuildAsset() {

		//  	if (typeof html2canvas === 'undefined') {
		// 		await new Promise((resolve, reject) => {
		// 			const script = document.createElement('script');
		// 			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
		// 			script.onload = resolve;
		// 			script.onerror = reject;
		// 			document.head.appendChild(script);
		// 		});
		// 	}

		// 	const shell = document.getElementById('phone-shell');
		// 	const layer = document.getElementById('phone-layer');

		// 	layer.style.display = 'flex';
		// 	shell.style.transform = 'none';
			
		// 	await new Promise(r => setTimeout(r, 500));

		// 	const canvas = await html2canvas(shell, {
		// 		backgroundColor: null,
		// 		scale: 3,
		// 		useCORS: true,
		// 		logging: true
		// 	});

		// 	canvas.toBlob(blob => {
		// 		const a = document.createElement('a');
		// 		a.download = 'phone-glitch-snapshot.png';
		// 		a.href = URL.createObjectURL(blob);
		// 		a.click();
		// 	});

		// 	shell.style.transform = '';
		// }
	});
});

