/* global monogatari */

// Layer che compongono la "stanza" nelle scene composite (sfondo Monogatari,
// cielo, oggetti). Usato per lo zoom d'ingresso della scena accettazione.
function roomLayers() {
	return [
		document.querySelector('game-screen'),
		document.getElementById('sky'),
		document.getElementById('details-wrapper')
	].filter(Boolean);
}

// Define the messages used in the game.
monogatari.action ('message').messages ({
	'Help': {
		title: 'Help',
		subtitle: 'Some useful Links',
		body: `
			<p><a href='https://developers.monogatari.io/documentation/'>Documentation</a> - Everything you need to know.</p>
			<p><a href='https://monogatari.io/demo/'>Demo</a> - A simple Demo.</p>
		`
	}
});

// Define the notifications used in the game
monogatari.action ('notification').notifications ({
	'Welcome': {
		title: 'Welcome',
		body: 'This is the Monogatari VN Engine',
		icon: ''
	}
});

// Define the Particles JS Configurations used in the game
monogatari.action ('particles').particles ({

});

// Define the canvas objects used in the game
monogatari.action ('canvas').objects ({

});

// Credits of the people involved in the creation of this awesome game
monogatari.configuration ('credits', {

});


// Define the images that will be available on your game's image gallery
monogatari.assets ('gallery', {
});

// Define the music used in the game.
monogatari.assets ('music', {
	rage_scene: 'mus_rabbia_loop.mp3',
	depression_scene: 'mus_depressione_loop.mp3',
	rain: 'rain.mp3'

});

// Define the voice files used in the game.
monogatari.assets ('voices', {

});

// Define the sounds used in the game.
monogatari.assets ('sounds', {
	typewriter: 'typewriter.mp3',
	crash: 'sfx_incidente.mp3',
	crash_short: 'crash.mp3',
	phone_vibration: 'phone_vibration.mp3',
	phone_notification: 'phone_notification.mp3',
	birds: 'sfx_respiro_uccellini.mp3'
});

// Define the videos used in the game.
monogatari.assets ('videos', {

});

// Define the images used in the game.
monogatari.assets ('images', {

});

// Define the backgrounds for each scene.
monogatari.assets ('scenes', {
	room_night : 'stanza_sfondo_4.png',
	room_rage: 'stanza_sfondo_2.png',
	room_day_normal: 'stanza_sfondo_1.png',
	room_day_dark: 'stanza_sfondo_3.png',
	room_accettazione: 'stanza2_sfondo_1.png',
	auto: 'Auto.png',
	feet: 'Piedi.png',
	teddybear: 'Orsacchiotto.png',
	outside: 'scena2_mondo.png',
	end: 'Foto.png'
});


// Define the Characters
monogatari.characters ({
	'shadow': {
		name: 'Ombra',
		color: '#5a3d90'
	},
	'dad': {
		name: 'Tu',
		color: '#66bdda'
	}
});

monogatari.script ({
	// The game starts here.

	'Start': [
		'show scene #000000 with fadeIn',

		//Test negazione
		//'jump Rabbia',

		{
			TypeCentered: `Cosa tiene in vita una luce che non riesce più a farsi strada perchè soffocata da una nebbia densa e nera come pece?`
		},

		{
			TypeCentered: `La soffocante sensazione di affondare le gambe nelle sabbie mobili, che ti trascinano giù, sempre più giù`
		},

		{
			TypeCentered: `E tu ti dimeni e pensi che provare ad uscirne in questo modo sia il punto di rottura che ti permetterà di trascinare fuori i polpacci pesanti dal fango`
		},

		{
			TypeCentered: `Ma le sabbie mobili illudono e tu speri che la soluzione si palesi nella forma più semplice ai tuoi occhi`
		},

		{
			TypeCentered: `Per poi pietrificarti, nell’angosciante consapevolezza che l’unica cosa da fare è rallentare e aspettare e respirare appena.`
		},

		{
			TypeCentered: `Le nubi, la pece, la sabbia, l’angoscia, la fiamma, l’attesa. L’inesorabile scorrere dei minuti che afferra e ti scuote e rimargina i segni del tempo, mentre tu affondi lentamente.`
		},

		() => PanicBreath.start(),

		{
			TypeCentered: `Allora, dimmi, qual  è la soluzione?`
		},

		{
			TypeCentered: `Attendere inerme o dimenarsi nella speranza di un appiglio che sia salvezza?`
		},

		// Niente pulsante "RESPIRA": dopo l'ultima domanda si scivola dritti
		// nell'intermezzo. Il respiro di panico avviato sopra continua a salire e
		// fa da ponte sonoro verso il minigioco della respirazione.
		'jump Intermezzo_Respira',
	],

	// Intermezzo_Respira — transizione fluida tra l'attacco di panico e il
	// minigioco della respirazione (poi la scena Torcia). Nessun pulsante: il
	// passaggio è guidato solo dal respiro e dalle dissolvenze.
	//
	// FLUSSO — un unico arco "panico → calma":
	//   1. wait 1000  → il respiro di panico resta appeso al culmine ancora un
	//                   istante dopo l'ultima domanda angosciante.
	//   2. release()  → il respiro comincia a rallentare: ponte sonoro.
	//   3. wait 1500  → lo si ascolta calare nel buio prima che appaia il cerchio.
	//   4. start()    → il cerchio guidato appare in dissolvenza mentre
	//                   BreathingGame dissolve (fade-out) l'audio di PanicBreath:
	//                   nessuno stacco netto tra i due respiri. async/await così
	//                   Monogatari attende la fine del minigioco prima di Torcia.

	'Intermezzo_Respira': [
		'wait 1000',
		'play sound crash_short',
		() => PanicBreath.release(),
		'wait 1500',
		async () => await BreathingGame.start(),
		'jump Torcia'
	],

//TORCIA
	'Torcia': [
		async () => {
			await SceneFade.toVisible();
			await AudioManager.play('fan', {
				loop: true,
				fade: 1,
				volume: 0.2
			});
			await SceneUtility.loadScene("torcia");
		},
		'show scene room_night with fadeIn',
		'wait 1500',
		async () => {
			NightOverlay.showNight();
			await SceneFade.toHidden();
						
			showTextBox();
		},
		
		//'play breathe volume 30 loop',
		'dad No! NO!',
		'dad ...aspetta, respira. Era solo...solo un incubo, ma la stessa scena si ripete ormai tutte le notti.',
		'dad Succede spesso quando dormo male...può capitare.',
		
		() => hideTextBox(false),
		
		'wait 3000',

		() => showTextBox(),

		'dad Questa stanza è troppo buia...ma dove ho messo il telefono?',
		() => hideTextBox(false),
		'wait 3000',
		() => showTextBox(),

		'dad ...eccolo!',

		async () => {
			// Toggle nascosto: il telefono si apre da solo e non deve poter essere chiuso
			// prima di aver acceso la torcia.
			hideTextBox(false);
			await PhoneUI.waitForTorchUnlock();
			NightOverlay.showTorch();
			PhoneToggle.show();
		},

		'jump loop_torcia',
	],

	'DialogoTorcia_Pianta': [
		() => showTextBox(),
		'dad <div style="color: #000000;">.</div>',
    	'dad Dovrei annaffiarla, ha bisogno di luce, sta perdendo tutte le foglie.',
		'dad Oggi lo faccio, devo solo organizzarmi meglio, non voglio che si secchi del tutto.',
		'dad Si...si...lo farò dopo, dopo che mi sarò alzato.',
    	() => {
			hideTextBox();
			SceneUtility.unlockTorch();
		},
		'jump loop_torcia'
	],

	'DialogoTorcia_Cornice': [
		() => showTextBox(),
		'dad <div style="color: #000000;">.</div>',
    	'dad Quanta polvere...non si vede neanche più la fotografia.',
		'dad Sei così felice lì, quel giorno al parco ci siamo divertiti molto, abbiamo preso un gelato, passeggiato e cantato le tue canzoni preferite.',
		'dad Dovremmo rifarlo!',
		'dad Anche perché...',
		'dad ...si, potremmo...',
		'dad ...dovremmo proprio rifarlo.',
		() => {
			hideTextBox();
			SceneUtility.unlockTorch();
		},
		'jump loop_torcia'
	],

	'DialogoTorcia_Porta': [
		() => showTextBox(),
		'dad <div style="color: #000000;">.</div>',
    	'dad Mi sento così stanco, non ho voglia di uscire.',
		'dad Non so neanche che ore sono.',
		'dad Potrei dormire ancora un po’.',
		'dad ...',
		'dad Dovrei far sistemare la maniglia, prima o poi si romperà del tutto.',
		() => {
			hideTextBox();
			SceneUtility.unlockTorch();
		},
		'jump loop_torcia'
	],

	'DialogoTorcia_Mobile': [
		() => showTextBox(),
		'dad <div style="color: #000000;">.</div>',
    	'dad Ti ho comprato una nuova maglietta, sono sicuro che ti piacerà',
		'dad È verde, il tuo colore preferito.',
		'dad ...',
		'dad Chissà che faccia farai quando la vedrai!',
		() => {
			hideTextBox();
			SceneUtility.unlockTorch();
		},
		'jump loop_torcia'
	],

	'wait_torcia': [
		'wait 300',
		'jump loop_torcia'
	],

	'loop_torcia': [
		{'Conditional': {
        	'Condition': function () {
            	const store = monogatari.storage();
				return store.clickedObjects.length === store.allObjects.length;
        	},

        	'True': 'jump Continua_Torcia',
        	'False': 'jump wait_torcia'
    	}},
	],

	'Continua_Torcia': [
		// 'centered <div style="color: #e5e5e5; font-style: italic; z-index: 14 !important;">Si è fatta una certa ora...provo a riaddormentarmi.</div>',
		// () => NightOverlay.hideTorch(),
		'wait 2000',
		() => {
			NightOverlay.isFrozen = true;
			const wrapper = document.getElementById('details-wrapper');
			if(wrapper) wrapper.style.pointerEvents = 'none'
			showTextBox();
		},

		'dad È tardi...meglio dormire.',

		async () => {
			NightOverlay.hideTorch();
			await BlinkOverlay.blink(1000);
			hideTextBox();
			SceneUtility.addBlur(2000);
			await BlinkOverlay.doubleBlink(400);
			await SceneFade.toVisible({duration: 5});
			await AudioManager.fadeOut('fan', 5);
		},
		'jump Negazione_Cellulare'

		// () => {
		// 	SceneUtility.enableBackground();
		// 	NightOverlay.hide();
		// 	SceneUtility.emptyScene();
		// 	hideTextBox();
		// },
		



		// 'show scene #000000 with fadeIn',

		// () => {
		// 	NightOverlay.hide();
		// 	hideClickableObjects();
		// },
		// 'wait 2000',
		// 'show scene room with fadeIn',
		// {
		// 	TypeCentered : `Buongiornissimo, caffè?`
		// }
	],

//NEGAZIONE
	'Negazione_Cellulare': [
        async () => {
			NightOverlay.hide();

			await SceneUtility.loadScene("negazione"); 
			await AudioManager.play('fan', {volume: 0.2, fade: 1, loop: true});
		},

		'show scene room_day_dark',
		'wait 1500',
		async () =>  await SceneFade.toHidden(),

		async () => {
			await BlinkOverlay.blink(150);
			await sleep(2000);
			await BlinkOverlay.doubleBlink(150);
			SceneUtility.removeBlur(2000);
		},

		'wait 3500',

        'play sound phone_vibration',
		'play sound phone_notification',

        () => {
			PhoneUI.reset();
			// Imposta il mittente senza aprire il telefono: vedrai solo badge e lockscreen.
			PhoneUI.setContactName('Giulia');
			PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
			// PhoneUI.vibrate();
		},                

        // PhoneChoice mostra questi pulsanti direttamente nella chat del telefono.
        {'PhoneChoice': {
            'Rispondi': {
                'Text': 'RISPONDI',
				'Do': 'jump Negazione_Rispondi',       
            },
            'Ignora': {
                'Text': 'IGNORA',
                'Do': 'jump Negazione_Ignora'
            }
        }}
    ],

    'Negazione_Rispondi': [
        async () => {
			// await HeartbeatManager.start({bpm: 75, fadeIn: 1.5, volume: 1})
			// HeartbeatManager.accelerate(120, 6);
			await HeartbeatManager.start({ bpm: 75, fadeIn: 0.2, volume: 1 });
			return new Promise(resolve => {
				PhoneTyping.show('Si dai, perché no...fammi finire un paio di cose e ti aggiorno', 80, resolve);
			})
		},

		async() => {
			PhoneTyping.send();
			await sleep(300);
			PhoneUI.addOutgoing('Si dai, perché no...fammi finire un paio di cose e ti aggiorno');
			PhoneTyping.hide();
			// SceneUtility.addBlur(2000);
			// await sleep(1500);
			// SceneUtility.addSaturation(2500);
			// HeartbeatManager.accelerate(180, 4);
			// await sleep(6000);
			// SceneUtility.removeBlur(2000);
			// SceneUtility.removeSaturation(0);
			// HeartbeatManager.decelerate(75, 3);
			// PhoneGlitch.trigger(2000);
			// await sleep(2000);
			const bubbles = document.querySelectorAll('.phone-bubble.outgoing');
			const lastBubble = bubbles[bubbles.length - 1];

			if (lastBubble) {
				await PhoneGlitch.sequence(
					lastBubble,	//object
					'\u2298 Questo messaggio \u00e8 stato eliminato',	//new text
					'deleted',	//new text class
					8000,	//duration
					1.05	//scale
				);
			}

			// const shell = document.getElementById('phone-shell');
			// console.log(getComputedStyle(shell).transform);
			// PhoneGlitch.zoomShell(2000, 1.18);
			// setTimeout(() => console.log(getComputedStyle(shell).transform), 500);

			// SceneUtility.removeBlur(1000);
			// await sleep(3000);
			// HeartbeatManager.stop();
			
			await sleep(2000);
		},

		{'PhoneChoice':{ 
			'Rispondi': {
				'Text': 'Rispondi',
				'Do': '',
				'Disabled': true
			},
			'Ignora': {
				'Text': 'Ignora',
				'Do': 'jump Negazione_Ignora_2'
			}
		}}
                
        // 'jump Esercizio_Respirazione'	DA IMPLEMENTARE
    ],

	'Negazione_Ignora_2':[
		async () => {
			PhoneUI.hide();
			await AudioManager.play('birds', {fade: 1, volume: 0.4, loop: true});
		},

		() => showTextBox(),

		'dad Oggi.. oggi non ci riesco. Mi dispiace. Non ho neanche le forze per dirtelo.',

		() => hideTextBox(),

		async () => {
			await sleep(6000);
			AudioManager.fadeOut('birds', 2);
		},

		'jump Secondo_Messaggio'
	],

    'Negazione_Ignora': [
		() => PhoneUI.hide(),
		
		'wait 2000',
        'jump Secondo_Messaggio'
    ],

    'Secondo_Messaggio': [
        'play sound phone_vibration',
		'play sound phone_notification',

        () => {
                // Nuovo messaggio: telefono chiuso, solo notifica/badge.
                PhoneUI.setContactName('Giulia');
                PhoneUI.addIncoming('Sai che può solo farti bene, hai bisogno di aria. Ti aspetto.');
                // PhoneUI.vibrate();
                return true;
		},

        {'PhoneChoice': {
            'Esci': {
                'Text': 'ESCI',
                'Do': 'jump Esci_Casa'
            },
            'Rimani': {
                'Text': 'RIMANI A CASA',
                'Do': 'jump Rimani'
            }
        }}
    ],

	'Rimani':[
		async () => {
			PhoneToggle.show();
			PhoneUI.hide();
			SceneUtility.addDim(3000);
			const el = document.getElementById('phone-toggle');
			if (el) el.classList.add('disabled');
			await sleep(5000);
		},

		'play sound phone_vibration',
		'play sound phone_notification',

		() => PhoneUI.addIncoming('Sei per strada?'),

		'wait 2100',
		'play sound phone_vibration',
		'play sound phone_notification',

		() => PhoneUI.addIncoming('Sei ancora sotto la doccia, vero? Ahahahah...'),
		
		'wait 1600',
		'play sound phone_vibration',
		'play sound phone_notification',

		() => PhoneUI.addIncoming('Ti aspetto dentro, comincio a sentir freddo fuori'),

		'wait 1300',
		'play sound phone_vibration',
		'play sound phone_notification',

		() => PhoneUI.addIncoming('Ehi, tutto bene?'),

		'wait 900',
		'play sound phone_vibration',
		'play sound phone_notification',

		() => PhoneUI.addIncoming('Io ho già ordinato'),

		'wait 750',
		'play sound phone_vibration',
		'play sound phone_notification',

		() => {
			PhoneUI.addIncoming('Fra poco vado via...');
			const el = document.getElementById('phone-toggle');
			if (el) el.classList.remove('disabled');
		},

		'wait 500',

		async () => {
			await PhoneUI.waitUntilAllNotificationsRead();
		},

		{'PhoneChoice': {
            'Esci': {
                'Text': 'ESCI',
                'Do': 'jump Esci_Casa'
            },
            'Rimani': {
                'Text': 'RIMANI A CASA',
                'Do': 'jump Rimani_A_Casa'
            }
        }}

	],

	'Rimani_A_Casa':[
		async () => {
			await SceneFade.toVisible();
			SceneUtility.emptyScene();
			SceneUtility.removeDim();
			PhoneUI.hide();
			AudioManager.setLowPass(250, 1);
		},
		'show scene #000000',
		() => SceneFade.toHidden(),
		// 'show scene #000000 with fadeIn',
		'wait 5000',
		'play sound phone_vibration',
		'play sound phone_notification',
		
		async () => {
			// PhoneUI.reset();
			// Messaggio in arrivo: aggiorna il badge, ma lascia il telefono chiuso.
			PhoneUI.setContactName('Giulia');
			await PhoneUI.playMessages({
				type: 'incoming',
				text: 'Non lasciarmi aspettare.'
			})
			PhoneUI.hide();
			// PhoneUI.vibrate();
		},

		{'Choice':{
			'Apri la porta': {
				'Text': 'APRI LA PORTA',
				'Do': 'jump Esci_Casa with fadeOut'
			}
		}}
	],

	'Esci_Casa':[
		async () => {
			AudioManager.setLowPass(20000, 1.5);
			AudioManager.fadeOut('fan', 2.5);
			SceneUtility.removeDim();
			PhoneUI.hide();
			await SceneFade.toVisible({ color: '#fff' });
			SceneUtility.emptyScene();
		},

		'show scene outside',
		
		async () => {
			// Ambience parte subito
			AudioManager.play('ambience', { volume: 1, loop: false, fade: 1 });
			
			// Bagliore iniziale bianco (5 secondi)
			SceneUtility.addBW(500);
			await SceneFade.toHidden({ duration: 5 });
		},
		
		// B/N + primo blink
		async () => {
			await sleep(1000);
			await BlinkOverlay.blink(150);
			await sleep(1500);
		},
		
		// Scena normale
		async () => {
			SceneUtility.removeBW(4000);
			await sleep(4000);
		},
		
		// Secondo blink, poi saturazione graduale
		async () => {
			await BlinkOverlay.blink(150);
			await sleep(800);
			SceneUtility.addSaturation(6500);
			await sleep(3500);
		},
		
		// Picco saturazione: blur + fischio ovattato che emerge
		async () => {
			SceneUtility.addBlur(2000);
			
			await AudioManager.play('whistle', { volume: 1, loop: true, fade: 8 });

			const track = AudioManager.getTrack('whistle');
			await new Promise(resolve => {
				track.audio.onplay = resolve;	//Si trigghera solo quando l'audio parte veramente
				if(!track.audio.paused) resolve(); //se è già partito, risolvi subito 
			})

			AudioManager.setLowPass(1200, 3);
			await sleep(3000);
			AudioManager.setLowPass(5000, 5);
			// AudioManager.setLowPass(20000, 5);
			
			await sleep(5000);
		},
		
		// Blink → doppio blink
		async () => {
			await BlinkOverlay.blink(150);
			await sleep(600);
			await BlinkOverlay.blink(150);
			await sleep(400);
			await BlinkOverlay.closeLid(150);
			await sleep(800);
		},
		
		// Cambio sui piedi: rimuovi filtri
		'show scene feet',
		
		async () => {
			await BlinkOverlay.openLid(150);
			SceneUtility.removeBlur(3000);
			await sleep(500);
			SceneUtility.removeSaturation(2500);
			await sleep(1800);
		},
		
		// Scelta
		async () => {
			await BlinkOverlay.blink(200);
			await sleep(1500);
		},
			
		{'Choice':{
			'Torna a casa':{
				'Text': 'TORNA A CASA',
				'Do': 'jump Rabbia'
			}
		}}
	],
	

//RABBIA
	'Rabbia': [
		async () => {
			AudioManager.fadeOut('whistle', 0.5);
			await SceneFade.toVisible();
			AudioManager.play('rage', {
				loop: true,
				volume: 0.50,
				fade: 3
			});
			await SceneUtility.loadScene("rabbia");
		},
		'show scene room_rage',
		'wait 1500',
		async() => {
			await SceneFade.toHidden();
			
		},
		// 'play music rage_scene with loop volume 75',

		'wait 2000',

		'play sound phone_vibration',
		'play sound phone_notification',
		() => {
			PhoneUI.reset();
			// Prepariamo mittente e notifica; il giocatore aprira' il telefono dal pulsante.
			PhoneUI.setContactName('Giulia');
			PhoneUI.addIncoming('Come stai oggi? Ti va di vederci?');
			// PhoneUI.vibrate();
		},

		// Qui la risposta e' parte della conversazione, quindi resta dentro il telefono.
		{'PhoneChoice':{
			'Lasciami': {
				'Text': 'Lasciami in pace!',
				'Do': 'jump GlitchRabbia'
			}
		}}
	],


	'GlitchRabbia': [
		() => {
			PhoneUI.hide();
			const store = monogatari.storage();
			store.glitchGameCompleted = false;
			store.glitchGamePhase = 1;
			Glitch.start();
		},

		'jump loop_glitch'
	],

	
	'loop_glitch': [
		{'Conditional': {
			'Condition': function () {
				const store = monogatari.storage();
				return store.glitchGameCompleted === true;
			},

			'True': 'jump ContinuaGlitch with fadeOut',
			'False': 'jump wait_glitch'
		}}
	],

	'wait_glitch': [
		'wait 250',
		'jump loop_glitch'
	],

	'ContinuaGlitch': [
		// 'centered <div style="color: #e5e5e5; font-style: italic; z-index: 14 !important;">...</div>',
		// async () => {
		// 	document.getElementById('clock-display').style.display = 'block';
		// 	window.stopClock = startAcceleratingClock('clock-display');
		// },

		// 'wait 10000',

		// async () => {
		// 	if(window.stopClock) window.stopClock();
		// 	document.getElementById('clock-display').style.display = 'none';
		// },

		'wait 3000',
		// () => {
		// 	PhoneUI.reset();
		// 	// Apre direttamente la chat: non ci sono notifiche da leggere e lo
		// 	// sblocco della lockscreen e' disabilitato senza messaggi non letti.
		// 	PhoneUI.show('Giulia', { mode: 'chat' });
		// },

		async () => {
			PhoneUI.show('Messaggi');
			PhoneUI.addNotification({
				title: 'Messaggi',
				body: 'Nessun nuovo messaggio',
				notify: false
			}, false);

			await startAcceleratingClock();
			await sleep (2000);
			PhoneUI.reset();
			PhoneUI.show('Giulia', { mode: 'chat' });
		},

		// Mostriamo il comando come azione del telefono e poi scriviamo il messaggio scelto.
		{'PhoneChoice':{
			'Nuovo messaggio': {
				'Text': 'Scrivi un nuovo messaggio',
				'Do': 'wait 2000',
				'onChosen': function() {
					return new Promise(resolve => {
						PhoneTyping.show('Ehi', 180, resolve);
					});
				}
			}
		}},

		() => {
			PhoneTyping.send();
			PhoneUI.addOutgoing('Ehi');
			PhoneTyping.hide();
		},

		'wait 5000',

		() => PhoneUI.hide(),

		'jump Contrattazione'
	],
//CONTRATTAZIONE
	'Contrattazione': [
		async () => {
			await SceneFade.toVisible({duration: 5});
			await AudioManager.fadeOut('rage', 5);
			await SceneUtility.loadScene("contrattazione");
	
			//Pulisco i precedenti clickedObjects e ripopolo allObjects
			const store = monogatari.storage();
			store.clickedObjects = [];
			store.allObjects = SCENE_IMAGES.contrattazione
				.filter(item => item.onClick)
				.map(item => item.id);
		},

		'show scene room_day_dark',
		'wait 1500',
		
		async () => {
			await SceneFade.toHidden();		
			// await SceneUtility.endClickedItems();
		},

		'jump loop_contrattazione'
	],

	'wait_contrattazione': [
		'wait 300',
		'jump loop_contrattazione'
	],

	'loop_contrattazione': [
		{'Conditional': {
        	'Condition': function () {
            	const store = monogatari.storage();
				return store.clickedObjects.length === store.allObjects.length;
        	},

        	'True': 'jump Continua_Contrattazione',
        	'False': 'jump wait_contrattazione'
    	}},
	],

	'DialogoContrattazione_Cornice': [
		() => showTextBox(),
		'<div style="color: #000000;">.</div>',
		'dad Mi dispiace... mi dispiace così tanto.',
		'dad Non volevo, non doveva rompersi.',
		'dad Non sei tu, non sono arrabbiato con te, non sei neanche qui...',
		'dad Comprerò della colla e la sistemerò...',
		'dad Si, sistemerò tutto.',

		() => {
			hideTextBox();
			SceneUtility.unlockItemWrapper();
		},

		'jump loop_contrattazione'
	],

	'DialogoContrattazione_Vestiti': [
		() => showTextBox(),
		'<div style="color: #000000;">.</div>',
		'dad Dov’è finita la tua maglietta nuova?',
		'dad Ci sono troppi vestiti, non la trovo neanche più.',
		'dad C’è troppo disordine qui dentro… ecco, piegandoli sembra già più ordinato, una cosa alla volta, giusto?',
		'dad Un giorno alla volta.',
		
		() => {
			hideTextBox();
			SceneUtility.unlockItemWrapper();
		},

		'jump loop_contrattazione'
	],

	'DialogoContrattazione_Pianta':[
		() => showTextBox(),
		'<div style="color: #000000;">.</div>',
		'dad Mi sono poi scordato di annaffiarla, se non lo faccio adesso non lo faccio più.',
		'dad Ecco, così va molto meglio.',
		'dad Guarda quanta luce che entra, sembra una bella giornata, oggi.',
		
		() => {
			hideTextBox();
			SceneUtility.unlockItemWrapper();
		},

		'jump loop_contrattazione'
	],

	'Continua_Contrattazione':[
		'wait 3000',
		
		'play sound phone_vibration',
		'play sound phone_notification',
		
		async () => {
			// PhoneUI.reset();	NON RESETTO perchè mi serve che rimanga il messaggio di prima
			// Qui il telefono si apre perche' il giocatore sta gia scrivendo una chat attiva.
			// Non e' una notifica passiva: vogliamo mostrare la conversazione sul momento.
			PhoneUI.show('Giulia', { mode: 'chat' });
			
			//Old -- Cambiato approccio radicalmente
			// PhoneUI.addIncoming("Ehi, come va oggi?");

			// // await PhoneUI.waitUntilAllNotificationsRead(20000),
			// // await sleep(3000);

			// // notify:false evita badge/lockscreen per una risposta gia visibile in chat.
			// PhoneUI.addOutgoing("Va...alti e bassi, ma un giorno alla volta, giusto?", {
			// 	notify: false
			// });
			// await sleep(2000);
			// PhoneUI.addIncoming("Un giorno alla volta.", {notify: false})
			// await sleep(4000);
			// PhoneUI.addIncoming("Usciamo a fare una passeggiata? Ti vengo a prendere.", {notify: false});
			// await sleep(5000);
			// PhoneUI.addOutgoing("D'accordo. Ti aspetto, grazie.");
			// await sleep(4000);

			//New
			await PhoneUI.playMessages([
				{
					type: 'incoming',
					text: "Ehi, come va oggi?"
				},
				{
					type: 'outgoing',
					text: "Va...alti e bassi, ma un giorno alla volta, giusto?",
					options: { notify: false }
				},
				{
					type: 'incoming',
					text: "Un giorno alla volta.",
					options: { notify: false }
				},
				{
					type: 'incoming',
					text: "Usciamo a fare una passeggiata? Ti vengo a prendere.",
					options: { notify: false }
				},
				{
					type: 'outgoing',
					text: "D'accordo. Ti aspetto, grazie."
				}
			]);

			PhoneUI.reset();
			PhoneUI.hide();
		},

		'jump Depressione'
	],

//DEPRESSIONE
	'Depressione': [
		async () => {
			await SceneFade.toVisible({duration: 3.5});
			await SceneUtility.loadScene("depressione");
			await AudioManager.play('rain', {
				loop: true,
				volume: 0.05,
				fade: 6
			});

			await AudioManager.play('depression', {
				loop: true,
				volume: 0.35,
				fade: 6
			});
		},
		// 'play music rain with loop volume 30',
		// 'play music depression_scene with loop volume 50',
		'show scene room_night',
		// 'play music rain with loop volume 30',
		// 'play music depression_scene with loop volume 50',
		'wait 1500',
		async () => await SceneFade.toHidden({duration: 3.5}),

		'wait 5000',
		'play sound phone_vibration',
		'play sound phone_notification',
		async () => {
			PhoneUI.reset();

			await PhoneUI.playMessages([
				{
					type: 'incoming',
					text: 'Oggi è più difficile degli altri giorni, non devi essere sempre forte. '
				},
				{
					type: 'incoming',
					text: 'Va bene anche così.'
				}
			]),

			PhoneUI.hide();
		},

		'wait 2000',
		
		async() => {
			await SceneFade.toVisible({duration: 0.25});
			SceneUtility.emptyScene();
			AudioManager.setVolume('depression', 0.15, 1);
		},
		'show scene auto',
		async() => await SceneFade.toHidden({duration: 0.25}),
		'play sound crash',

		'wait 10000',
		async() =>{
			await SceneFade.toVisible({duration: 0.25});
			AudioManager.pause('rain');
			AudioManager.pause('depression');
		}, 
		'show scene teddybear',
		async () => {
			await SceneFade.toHidden({duration: 1});
			const gameScreen = document.querySelector('game-screen');
			if (!gameScreen) return;
			gameScreen.style.transformOrigin = 'center center';
			gameScreen.style.transition = 'transform 7s ease-in-out';
			requestAnimationFrame(() => {
				gameScreen.style.transform = 'scale(1.08)';
			});
		},
		'wait 7000',

		async () =>{
			await SceneFade.toVisible({duration: 1});
			
			//Qui uso solo 'play' perchè voglio che il loop della musica riparta da dove si è interrotto con l'orsacchiotto
			await AudioManager.play('rain');
			
			AudioManager.setVolume('depression', 0.35);
			await AudioManager.play('depression');
			//Ritorno alle dimensioni normali in maniera trasparente mentre lo schermo è nero
			//>>>
			const gameScreen = document.querySelector('game-screen');
			if (!gameScreen) return;
			gameScreen.style.transition = '';
			gameScreen.style.transform = '';
			//<<<
			
			await SceneUtility.loadScene("depressione");
			SceneUtility.addShadow();
		},
		'show scene room_night',
		// 'play music rain with loop volume 30',

		async () => {
			await SceneFade.toHidden({duration: 3});
			await SceneUtility.endClickedItems();
		},
		
		() => showTextBox(),
		'dad ...',
		'dad Non eri nel tuo letto quando mi sono svegliato.',
		'dad Non eri in giro per casa, {pause:500}non facevi colazione con i biscotti che tanto ti piacciono.',
		'dad Non eri neanche a scuola.',
		'dad Ho passato settimane a raccontarmi che eri solo nell’altra stanza, {pause:5000}che bastava non guardare per farti rimanere qui con me.',
		() => pauseTextBox(),
		'dad ...ma tu non ci sei più.',
		'dad Non come dovresti',
		'dad Ieri sono tornato dove tutto è successo ed io...{pause:500} io...',
		
		//Inserire pianto quando pronto
		() => pauseTextBox(),
		'shadow Papà, ho avuto paura, faceva così freddo',

		'dad Lo so... ricordo tutto adesso. Lo ricordo fin troppo chiaramente.',
		'dad Il rumore dei freni che non hanno risposto, la macchina capovolta e accartocciata.',
		'dad Ho tentato di allungare il braccio verso il sedile posteriore, ma non ci arrivavo.',
		'dad Ero incastrato e non sono riuscito a raggiungerti.',
		'dad Tu eri lì...{pause:500}...ed io non sono riuscito ad aiutarti.',
		() => pauseTextBox(),
		'dad Se solo...{pause:500} se solo avessi preso una decisione diversa, se solo avessi avuto un momento di lucidità in più, ora tu saresti qui.',
		
		'shadow Non è colpa tua, papà, tu volevi salvarmi',
		
		'dad Avrei dovuto esserci io al tuo posto, prendere tutto il dolore che hai provato e riversarlo solo e solamente dentro di me.',
		'dad Ma il mondo continua ad andare avanti anche senza di te.',
		'dad Le giornate sono sempre le stesse, ma sono vuote e tristi e sembrano inutili e dolorose.',
		() => pauseTextBox(),
		'dad Mi sento un guscio vuoto e non voglio...{pause:500} non riesco a svegliarmi ancora con questa consapevolezza.',
		'dad Non avrai più il futuro che sognavamo...',

		'shadow Ma papà, tu sì! Puoi costruirlo tu per tutti e due!',
		'shadow Esci fuori papà, vai avanti anche tu con il mondo.',
		'shadow E se il mondo corre...',
		'shadow ...tu sii un lumacone!',
		'shadow Non devi correre papà, devi imparare di nuovo a camminare, come hai insegnato a me quando ero piccolo!',
		
		'dad ...',
		'dad Ma fa troppo male... {pause:500} io non ci riesco.',

		'shadow Fai un solo passo, papà.',
		'shadow Esci fuori da questa stanza, continua a controllare i mostri sotto al mio letto, a raccogliere i fiori nel parco dove andavamo sempre',
		'shadow Così posso continuare a guardare il mondo attraverso i tuoi occhi.',

		'dad Attraverso i miei occhi...',

		() => pauseTextBox(10000),

		'shadow Papà, ti ricordi quando giocavamo a nascondino in giardino?',
		'shadow Tu contavi e io trovavo sempre un posto dove nascondermi',

		'dad Si...ti nascondevi sempre dietro i cespugli di margherite, erano i tuoi preferiti.',
		"shadow Si papà, ma tu mi trovavi sempre perchè c'erano quelle cose colorate che si posavano sulla mia testa!",
		'shadow Tu le seguivi e mi trovavi, non è giusto!',

		'dad Le cose colorate...le farfalle!',

		'shadow Ecco, sì! Le farfalle...mi piacevano le farfalle.',
		'shadow Ecco. Adesso tocca a te contare. Io mi sono nascosto benissimo stavolta papà, ma se esci da questa stanza, se guardi bene intorno...',
		'shadow ...mi troverai.',
		() => pauseTextBox(),
		'shadow Cerca le piccole cose colorate: ogni volta che ne vedrai una, io sono lì con te.',
		'shadow Promettimi che le cercherai!',

		'dad ...',
		() => pauseTextBox(),
		'dad ...va bene, te lo prometto. Le cercherò.',
		
		{'Choice': {
			'Let_Go':{
				'Text': 'LASCIALO ANDARE',
				'Do': 'jump Lascia_Andare'
			},
			'Not_Ready':{
				'Text': 'NON SONO ANCORA PRONTO',
				'Do': 'jump Non_Pronto'
			}
		}},
	],

	'Lascia_Andare': [
		'clear',
		() => hideTextBox(),
		'jump Accettazione'
	],

	'Non_Pronto': [
		async () => {
			await SceneFade.toVisible();
			await SceneUtility.loadScene("rabbia");
		},
		'show scene room_rage',
		'wait 1500',
		async() => {
			await SceneFade.toHidden();
			await AudioManager.play('rage', {
				loop: true,
				volume: 75,
				fade: 2
			})
		},

		// 'play music rage_scene with loop volume 75',

		'jump GlitchRabbia'
	],

//ACCETTAZIONE
	// Flusso:
	//   0. Accettazione: stanza buia (room_day_dark) con la porta che lampeggia;
	//      il click sulla porta conduce a Scena_Accettazione
	//   1. Scena_Accettazione: setup scena (fade, audio, oggetti interattivi)
	//   2. loop_accettazione: polling ogni 300ms finche' tutti gli oggetti sono stati cliccati
	//   3. TitoliDiCoda: titoli di coda + "Fine", poi 'end' → menu principale.
	//      (da sviluppare: dialogo finale + uscita dalla porta prima dei titoli)

	// Ingresso alla fase: la stanza e' ancora buia, l'unica cosa che attira
	// l'attenzione e' la porta che lampeggia (stessa meccanica .highlight degli
	// oggetti della contrattazione).
	'Accettazione': [
		async () => {
			// Nero prima di staccare dalla scena precedente
			await SceneFade.toVisible({duration: 2});

			// Ferma pioggia e musica depressione in parallelo: i due fadeOut sono indipendenti
			await Promise.all([
				AudioManager.fadeOut('rain', 1.5),
				AudioManager.fadeOut('depression', 1.5)
			]);

			// Svuota la scena precedente (rimuove la pioggia della depressione dal #sky)
			SceneUtility.emptyScene();

			// La musica dell'accettazione parte gia' qui, con la porta che lampeggia
			AudioManager.play('acceptance', {
				loop: true,
				volume: 0.35,
				fade: 3
			});

			// Stanza buia + sola porta lampeggiante
			await SceneUtility.loadScene("accettazione_porta");
		},
		'show scene room_day_dark',
		'wait 1500',
		async () => await SceneFade.toHidden({duration: 2}),
		// Nessun jump qui: il flusso prosegue solo quando il giocatore clicca
		// la porta (vedi commento sopra al label).
	],

	'Scena_Accettazione': [
		async () => {
			// La porta cliccata si ingrandisce e svanisce: si sta entrando.
			// Riusa la stessa classe .door-enter di porta_2 (vedi main.css).
			const porta = document.getElementById('porta_acc');
			if (porta) {
				porta.classList.add('door-enter');
				void porta.offsetWidth;
				porta.classList.add('door-enter-active');
				await new Promise(r => setTimeout(r, 1400));
			}

			// Fade a BIANCO, non a nero: e' la luce oltre la porta.
			// Prima transizione luminosa del gioco, coerente col tema dell'accettazione.
			await SceneFade.toVisible({duration: 2, color: '#fff'});

			// Carica cielo giorno_1 (soleggiato) + immagini degli oggetti
			// interattivi della stanza del bambino nel #details-wrapper
			// (la musica 'acceptance' e' gia' partita nel label Accettazione)
			await SceneUtility.loadScene("accettazione");

			// Inizializza il tracciamento degli oggetti cliccabili.
			// allObjects contiene solo gli id con 'onClick': tenda, cesta.
			// La porta non è in scena qui: la fase finale (uscita) è da sviluppare.
			const store = monogatari.storage();
			store.clickedObjects = [];
			store.allObjects = SCENE_IMAGES.accettazione
				.filter(item => item.onClick)
				.map(item => item.id);
		},
		'show scene room_accettazione',
		'wait 1500',
		// Sotto l'overlay bianco: la stanza (sfondo + cielo + oggetti) parte
		// leggermente rimpicciolita al centro dello schermo.
		() => {
			// Bordo bianco (non lo sfondo scuro del tema) intorno alla stanza rimpicciolita
			document.body.style.background = '#fff';
			// Ancorata in basso: il bordo inferiore resta attaccato al fondo
			// dello schermo, lo zoom "cresce" verso l'alto e i lati.
			for (const el of roomLayers()) {
				el.style.transition = 'none';
				el.style.transformOrigin = 'center bottom';
				el.style.transform = 'scale(0.97)';
			}

			// La porta NON si rimpicciolisce con la stanza: dentro al wrapper
			// (overflow:hidden + scale) verrebbe clippata, quindi si nasconde
			// quella in scena e si crea un layer gemello full-screen su body,
			// che copre il bordo bianco.
			const porta = document.getElementById('porta_2');
			if (porta) porta.style.opacity = '0';

			const doorLayer = document.createElement('img');
			doorLayer.id = 'door-layer';
			doorLayer.src = 'assets/images/porta_2.png';
			doorLayer.className = 'wrapper-item'; // stesso sizing cover/center dei layer di scena
			doorLayer.style.position = 'fixed';
			doorLayer.style.zIndex = '10';
			document.body.appendChild(doorLayer);
		},
		async () => await SceneFade.toHidden({duration: 2}),
		// Al reveal: zoom-in della stanza fino a riempire lo schermo, mentre
		// porta_2 si ingrandisce e svanisce (si e' appena entrati).
		// Il 'wait 4000' che segue copre la transizione piu' lunga (4s).
		() => {
			for (const el of roomLayers()) {
				void el.offsetWidth; // committa lo stato scale(0.94) prima di animare
				el.style.transition = 'transform 4000ms ease-out';
				el.style.transform = 'scale(1)';
			}

			// Il layer porta full-screen si ingrandisce e svanisce
			const doorLayer = document.getElementById('door-layer');
			if (!doorLayer) return;

			void doorLayer.offsetWidth; // committa lo stato iniziale prima di animare
			doorLayer.style.transformOrigin = 'center center';
			// Stessa durata/easing dello zoom stanza: i due movimenti sono sincroni
			doorLayer.style.transition = 'transform 4000ms ease-out, opacity 4000ms ease-out';
			doorLayer.style.transform = 'scale(1.15)';
			doorLayer.style.opacity = '0';
		},
		'wait 4000',
		// Rimuove gli inline transform: game-screen e #sky sopravvivono a questa
		// scena e non devono restare "toccati" nelle scene successive.
		() => {
			document.body.style.background = '';
			document.getElementById('door-layer')?.remove();
			for (const el of roomLayers()) {
				el.style.transition = '';
				el.style.transform = '';
				el.style.transformOrigin = '';
			}
		},
		'jump loop_accettazione'
	],

	// Stessa meccanica di loop_contrattazione/loop_torcia:
	// polling leggero ogni 300ms, jump appena il contatore e' completo.
	'wait_accettazione': [
		'wait 300',
		'jump loop_accettazione'
	],

	'loop_accettazione': [
		{'Conditional': {
			'Condition': function () {
				const store = monogatari.storage();
				return store.clickedObjects.length === store.allObjects.length;
			},
			'True': 'jump TitoliDiCoda',
			'False': 'jump wait_accettazione'
		}},
	],

	// Titoli di coda stile film (vedi EndCredits in main.js): fade a nero,
	// rullo con ruoli e nomi del team, poi "Fine" per 10 secondi.
	// play() risolve dopo i 10 secondi; 'end' riporta al menu principale
	// mentre il nero copre la transizione e si dissolve da solo.
	'TitoliDiCoda': [
		// Uscita dalla stanza: inversa esatta dell'ingresso in Scena_Accettazione.
		// La stanza si rimpicciolisce sul bordo bianco mentre il layer porta
		// full-screen riappare (da scale 1.15 trasparente a scale 1 visibile).
		() => {
			PhoneToggle.hide();
			ObjectCounter.hide();

			document.body.style.background = '#fff';

			// Stato di partenza = stato finale dell'ingresso
			for (const el of roomLayers()) {
				el.style.transition = 'none';
				el.style.transformOrigin = 'center bottom';
				el.style.transform = 'scale(1)';
			}

			const doorLayer = document.createElement('img');
			doorLayer.id = 'door-layer';
			doorLayer.src = 'assets/images/porta_2.png';
			doorLayer.className = 'wrapper-item';
			doorLayer.style.position = 'fixed';
			doorLayer.style.zIndex = '10';
			doorLayer.style.transformOrigin = 'center center';
			doorLayer.style.transform = 'scale(1.15)';
			doorLayer.style.opacity = '0';
			document.body.appendChild(doorLayer);
		},
		() => {
			for (const el of roomLayers()) {
				void el.offsetWidth; // committa lo stato scale(1) prima di animare
				el.style.transition = 'transform 4000ms ease-out';
				el.style.transform = 'scale(0.97)';
			}

			const doorLayer = document.getElementById('door-layer');
			if (!doorLayer) return;

			void doorLayer.offsetWidth;
			doorLayer.style.transition = 'transform 4000ms ease-out, opacity 4000ms ease-out';
			doorLayer.style.transform = 'scale(1)';
			doorLayer.style.opacity = '1';
		},
		'wait 4000',
		async () => {
			await EndCredits.play(); // risolve al click del giocatore dopo "Fine"

			// Sotto il nero: ferma tutte le musiche/loop custom e riporta il
			// gioco allo stato pulito prima del ritorno al menu. Riusa i reset
			// del debug menu (audio, overlay, torcia, flag di storage): sono
			// gli stessi necessari per un "torna al menu e ricomincia".
			AudioManager.stopAll();
			DebugMenu.resetNightRuntime();
			DebugMenu.resetVisualOverlays();
			DebugMenu.resetStorageFlags();

			document.body.style.background = '';
			for (const el of roomLayers()) {
				el.style.transition = '';
				el.style.transform = '';
				el.style.transformOrigin = '';
			}
			SceneUtility.emptyScene();
			SceneUtility.enableBackground();
		},
		'end'
	],

	// Ogni dialogo:
	//   1. mostra textbox e testo del padre
	//   2. nasconde textbox
	//   3. unlockItemWrapper: lockContrattazioneObject aveva bloccato il wrapper
	//      al momento del tap sull'oggetto \u2014 va riabilitato a fine dialogo
	//   4. torna al loop per controllare se ci sono altri oggetti da cliccare

	'DialogoAccettazione_Tenda': [
		() => showTextBox(),
		'<div style="color: #000000;">.</div>',
		'dad La luce...',
		'dad Da quanto non la lasciavo entrare.',
		() => {
			hideTextBox();
			SceneUtility.unlockItemWrapper();
		},
		'jump loop_accettazione'
	],

	'DialogoAccettazione_Cesta': [
		() => showTextBox(),
		'<div style="color: #000000;">.</div>',
		'dad Uno alla volta.',
		'dad Proprio come mi hai detto tu.',
		() => {
			hideTextBox();
			SceneUtility.unlockItemWrapper();
		},
		'jump loop_accettazione'
	],

	'TestClock': [
		async () => await SceneUtility.loadScene("rabbia"),
		'show scene room_rage',
		() => {
			PhoneUI.show();
			startAcceleratingClock();
		}
	],

	// Scena isolata: non viene richiamata dal flow narrativo, solo dal menu di debug.
	'Test_telefono': [
		'show scene #000000 with fadeIn',

		() => {
			// Pulizia iniziale: chiude il telefono, svuota chat e svuota notifiche/badge.
			PhoneUI.hide();
			PhoneUI.reset();

			PhoneUI.setContactName('Tony Pitony');
			PhoneUI.addIncoming('Ciao sono Tony sono quello di ieri');
			PhoneUI.addIncoming('Non ti ho piu richiamata perche ti puzzano i piedi');

			// clearNotifications() cancella solo notifiche e badge.
			// La chat resta visibile e i messaggi gia aggiunti non vengono rimossi.
			PhoneUI.clearNotifications();

			// PhoneUI.vibrate(600);
		},

		{'PhoneChoice': {
			'Test 1': {
				'Text': 'Chi ti conosce?',
				'Do': 'wait 300',
				'onChosen': function() {
					PhoneUI.addOutgoing('Ma chi cazzo sei chi ti conosceeeeeh!');
				}
			},
			'Test 2': {
				'Text': 'Blocca Schermo',
				'Do': 'wait 300',
				'onChosen': function() {
					PhoneUI.switchMode();
				}
			},
			'Test 3': {
				'Text': 'Messaggio silenzioso',
				'Do': 'wait 300',
				'onChosen': function() {
					PhoneUI.switchMode();
					// notify: false aggiunge il messaggio alla chat senza incrementare badge/lockscreen.
					// Usalo per messaggi che vuoi mostrare nello storico, ma che non devono sembrare nuovi.
					PhoneUI.addIncoming('Questo messaggio e silenzioso: entra in chat, ma non aumenta il badge.', {
						notify: false
					});
				}
			},
			'Test 4': {
				'Text': 'Messaggio n notifiche',
				'Do': 'wait 300',
				'onChosen': function() {
					PhoneUI.switchMode();
					/// notificationCount permette di aggiungere piu notifiche con una sola chiamata.
					// Questo e' utile quando vuoi simulare piu messaggi arrivati insieme.
					PhoneUI.addIncoming('Questo messaggio vale tre notifiche.', {
						notificationCount: 3
					});
				}
			}
		}},
	]

		/*
		'Yes': [
			'y Thats awesome!',
		'y Then you are ready to go ahead and create an amazing Game!',
		'y I can’t wait to see what story you’ll tell!',
		'end'
	],

	'No': [

		'y You can do it now.',

		'show message Help',

		'y Go ahead and create an amazing Game!',
		'y I can’t wait to see what story you’ll tell!',
		'end'
	]*/
});
