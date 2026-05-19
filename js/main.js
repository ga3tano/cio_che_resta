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
	intensity: 0,	//range 0 = calma, 1 = furia
	zoom: 1,	//partenza zoom, aumenta gradualmente

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

	start(){
		if (this.active) return;

		const bg = document.getElementById('background');
		if(!bg) return;

		this.active = true;
		this.intensity = 0;
		this.startTime = performance.now();

		// Lo zoom deve avvenire dal centro reale dell'immagine
		bg.style.transformOrigin= "center center";
		bg.style.willChange = "transform";

		const loop = () => {
			if(!this.active) return;

			//Mi calcolo quanto tempo è passato dall'inizio del loop
			const now = performance.now();
			const elapsed = now - this.startTime; 

			//Intensità progressiva
			this.intensity = Math.min(1, this.intensity + this.config.intensityStep);
			
			//Calcoli per arrivare gradualmente alla scala del bg minima per non avere bordi (zoom iniziale)
			const rampLinear = Math.min(1, elapsed / this.config.rampDuration);
			const rampProgress = Math.pow(rampLinear, this.config.rampExponent);
			
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const safeScaleX = (vw + this.config.maxShakePx * 2)/vw;
			const safeScaleY = (vh + this.config.maxShakePx * 2)/vh;
			
			//Scala minima per non mostrare bordi al massimo shake
			const safeScale = Math.max(safeScaleX, safeScaleY);

			//Transizione lineare da scale(1) a scale(scaleSafe)
			const safeScaleProgressive = 1 + (safeScale - 1) * rampProgress;

			//Zoom
			const emotionalZoom = 
				this.config.baseZoomExtra * this.intensity +
				this.config.rageZoomExtra * Math.pow(this.intensity, 2); //Uso una funzione quadratica per aumentare l'intensità verso la fine più velocemente

			const totalScale = safeScaleProgressive + emotionalZoom;

			//Shake con curva non lineare:
			let shakeStrength = 
				this.config.maxShakePx * 
				(0.15 * this.intensity + 0.85 * Math.pow(this.intensity, 2));

			//Durante il buildup iniziale limitiamo lo shake fino al raggiungimento della safeScale
			shakeStrength *= rampProgress;

			//Aggiungo degli spike randomici
			const hasSpike = Math.random() < this.config.spikeChance;
			if (hasSpike){
				shakeStrength *= this.config.spikeMultiplier;
			}

			//Movimento casuale sugli assi:
			const shakeX = (Math.random() * 2 - 1) * shakeStrength;
			const shakeY = (Math.random() * 2 - 1) * shakeStrength;

			//Rotazione irregolare: poco all'inizio, più instabile dopo
			const rotate = 
				(Math.random() * 2 - 1) * 
				this.config.rotationMaxDeg * 
				Math.pow(this.intensity, 1.2);

			//Distorsione asimmetrica per simulare perdita di controllo visivo
			const stretchX = 1 + this.config.stretchMax * this.intensity * (0.6 + Math.random() * 0.4);
			const stretchY = 1 + this.config.squeezeMax * this.intensity * (0.6 + Math.random() * 0.4);

			//Bordo rosso che aumenta con la rabbia
			const border = document.getElementById("rage-border");
			if(border){
				const borderIntensity = 0.25 * this.intensity + 0.75 * Math.pow(this.intensity, 2);
				border.style.opacity = borderIntensity;
			}

			//Applico tutti gli effetti
			bg.style.transform = 
			`translate(${shakeX}px, ${shakeY}px) ` + //shake
			`rotate(${rotate}deg) ` + 	//rotazione
			`scale(${totalScale * stretchX}, ${totalScale * stretchY})`;	//zoom + distorsione 

			//Al crescere della rabbia, il ritmo accelera
			const nextDelay = this.config.baseDelay - this.intensity * this.config.delayRamp;
			this.timer = setTimeout(loop, Math.max(this.config.minDelay, nextDelay));
		};

		loop();
	},

	//Stessa animazione, ma a specchio e molto più brusca. Evito l'effetto "taglio netto".
	cooldown() {
		const bg = document.getElementById("background");
		if (!bg) return;

		let intensity = this.intensity;

		// Durata molto più breve
		const duration = 400; // prima era 1200

		const startTime = performance.now();

		const loop = () => {
			const now = performance.now();
			const t = Math.min(1, (now - startTime) / duration);

			// Curva più ripida = rientro più veloce ma coerente
			const ease = 1 - Math.pow(t, 1.6);

			const currentIntensity = intensity * ease;

			// Zoom emotivo
			const emotionalZoom =
				this.config.baseZoomExtra * currentIntensity +
				this.config.rageZoomExtra * Math.pow(currentIntensity, 2);

			// Shake
			let shakeStrength =
				this.config.maxShakePx *
				(0.15 * currentIntensity + 0.85 * Math.pow(currentIntensity, 2));

			const shakeX = (Math.random() * 2 - 1) * shakeStrength;
			const shakeY = (Math.random() * 2 - 1) * shakeStrength;

			// Rotazione
			const rotate =
				(Math.random() * 2 - 1) *
				this.config.rotationMaxDeg *
				Math.pow(currentIntensity, 1.2);

			// Distorsione
			const stretchX = 1 + this.config.stretchMax * currentIntensity;
			const stretchY = 1 + this.config.squeezeMax * currentIntensity;

			const totalScale = 1 + emotionalZoom;

			const border = document.getElementById("rage-border");
			if(border) border.style.opacity = currentIntensity;

			bg.style.transform =
				`translate(${shakeX}px, ${shakeY}px) ` +
				`rotate(${rotate}deg) ` +
				`scale(${totalScale * stretchX}, ${totalScale * stretchY})`;

			if (t < 1) {
				requestAnimationFrame(loop);
			} else {
				bg.style.transform = "translate(0,0) rotate(0deg) scale(1,1)";
			}
		};

		requestAnimationFrame(loop);
	},

	stop() {
		
		this.active = false;
		clearTimeout(this.timer);
		this.timer = null;

		this.cooldown();
	}
};

const WordsGame={
	start(){
		const store = monogatari.storage();
	}

}

/*
FUNZIONI CUSTOM
*/ 

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

$_ready (() => {
	// 2. Inside the $_ready function:

	monogatari.init ('#monogatari').then (() => {
		// 3. Inside the init function:

	});
});


