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

monogatari.registerAction (TypeCentered);

/*
OGGETTI CUSTOM
*/

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
	sceneLayerSelectors: [
		"#sky",
		"#background",
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
	getWrapperNeutralScale(){
		const overscan = 64;	//valore in px della proprietà "inset" del wrapper nel css
		const scaleX = window.innerWidth / (window.innerWidth + overscan * 2);
		const scaleY = window.innerHeight / (window.innerHeight + overscan * 2);

		return {
			x: scaleX,
			y: scaleY
		};
	},

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

				if (restoreAtEnd) {
					const neutralScale = this.getWrapperNeutralScale();
					const neutralProgress = eased;

					totalScaleX += (neutralScale.x - 1) * neutralProgress;
					totalScaleY += (neutralScale.y - 1) * neutralProgress;
				}

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

					if (restoreAtEnd) {
						const neutralScale = this.getWrapperNeutralScale();
						finalScaleX *= neutralScale.x;
						finalScaleY *= neutralScale.y;
					}

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
const SceneWithSky = {
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
		const imageSrc = `../assets/scenes/cielo_${typeOfSky}.png`;
		
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

	hideSky(){
		const sky = document.getElementById("sky");
		sky.style.display = "none";
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
			this.inAudio = new Audio("../assets/sounds/breath_in.mp3");
			this.outAudio = new Audio("../assets/sounds/breath_out.mp3");
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
				const t = Math.min(elapsed / 4, 1);	//normalizzato 0 -> 1
				
				this.volume = 0.2 + (1 - Math.pow(2, -10 * t)) *0.8;	//Easing esponenziale volume	
				this.rate = 1 + t * 2; //rate cresce più velocemente da 1 a 3 
				
				if(t >= 1)
					this.state = "plateau";
				break;

			case "plateau":
				this.rate = 3;
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

// async function loadSky(typeOfSky){
// 	function preloadImage(src){
// 		return new Promise((resolve, reject) => {
// 			const img = new Image();
// 			img.onload = resolve;
// 			img.onerror = reject;
// 			img.src = src;
// 		});
// 	}
	
// 	const sky = document.getElementById("sky");
// 	const overlay = document.getElementById("sceneFadeOverlay");

// 	//Imposto l'immagine di background del div
// 	const imageSrc = `../assets/scenes/cielo_${typeOfSky}.png`;
	
// 	overlay.classList.add("covering");

// 	await preloadImage(imageSrc);

// 	sky.style.display = "block";
// 	sky.style.backgroundImage= `url("${imageSrc}")`;

// 	document.body.classList.add("composite-sky-scene");
// }

// function revealPreparedScene() {
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
// }

// function hideSky(){
// 	const sky = document.getElementById("sky");
// 	sky.style.display = "none";
// }

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

/*UTILITY*/
function lerp (a, b, t){
	return a + (b - a) * t;
} 

function sleep(ms){
	return new Promise(resolve => setTimeout(resolve, ms));
}

$_ready (() => {
	// 2. Inside the $_ready function:

	monogatari.on('start', () => {
		const screens = document.querySelectorAll('game-screen[data-component="game-screen"]');
		console.log("Sono entrato, screens:" + screens);
		if(screens)
			screens.forEach(s => {s.style.backgroundColor = "transparent";});
	})

	monogatari.init ('#monogatari').then (() => {
		// 3. Inside the init function:

	});
});


