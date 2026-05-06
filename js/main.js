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

monogatari.registerAction (TypeCentered);

const PhoneUI = {
    layer: null,
    shell: null,
    chat: null,
    contact: null,

    init() {
        this.layer = document.getElementById('phone-layer');
        this.shell = document.getElementById('phone-shell');
        this.chat = document.getElementById('phone-chat');
        this.contact = document.getElementById('phone-contact');
    },

    show(contactName = 'Giulia') {
        if (!this.layer) this.init();

        this.contact.textContent = contactName;
        this.layer.classList.add('visible');
        this.layer.setAttribute('aria-hidden', 'false');
    },

    hide() {
        if (!this.layer) this.init();

        this.layer.classList.remove('visible');
        this.layer.setAttribute('aria-hidden', 'true');
        this.stopVibration();
    },

    reset() {
        if (!this.layer) this.init();
        this.chat.innerHTML = '';
    },

    addIncoming(text) {
        this.addBubble(text, 'incoming');
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
    }
};

$_ready (() => {
	// 2. Inside the $_ready function:

	monogatari.init ('#monogatari').then (() => {
		// 3. Inside the init function:

	});
});
