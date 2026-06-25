/* global monogatari */

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
	rain: 'rain.mp3'

});

// Define the voice files used in the game.
monogatari.assets ('voices', {

});

// Define the sounds used in the game.
monogatari.assets ('sounds', {
	typewriter: 'typewriter.mp3',
	crash: 'sfx_incidente.mp3',
	phone_vibration: 'phone_vibration.mp3',
	phone_notification: 'phone_notification.mp3',
	brids: 'sfx_respiro_uccellini.mp3'
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
		() => PanicBreath.release(),
		'wait 1500',
		async () => await BreathingGame.start(),
		'jump Torcia'
	],

//TORCIA
	'Torcia': [
		async () => {
			await SceneFade.toVisible();
			SceneUtility.loadScene("torcia");
		},
		'show scene room_night with fadeIn',
		'wait 1500',
		async () => {
			NightOverlay.showNight();
			await SceneFade.toHidden();
			
			//Disabilito i click per poter per mettere di far skippare i dialoghi
			SceneUtility.lockItemWrapper();
			
			showTextBox();
		},
		
		//'play breathe volume 30 loop',
		'dad No! NO!',
		'dad ...aspetta, respira. Era solo...solo un incubo, ma la stessa scena si ripete ormai tutte le notti.',
		'dad Succede spesso quando dormo male...può capitare.',
		
		() => hideTextBox(),
		
		'wait 3000',

		() => showTextBox(),

		'dad Questa stanza è troppo buia...ma dove ho messo il telefono?',
		() => hideTextBox(),
		'wait 3000',
		() => showTextBox(),

		'dad ...eccolo!',

		() => {
			hideTextBox();

			//Riabilito i click per permettere il corretto funzionamento della torcia
			SceneUtility.unlockItemWrapper();

			NightOverlay.showTorch();
		},

		'jump loop_torcia',
	],

	'DialogoTorcia_Pianta': [
		() => showTextBox(),
		'<div style="color: #000000;">.</div>',
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
		'<div style="color: #000000;">.</div>',
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
		'<div style="color: #000000;">.</div>',
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
		'<div style="color: #000000;">.</div>',
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
			SceneUtility.addBlur();
			await BlinkOverlay.doubleBlink(400);
			await SceneFade.toVisible({duration: 5});
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

			SceneUtility.loadScene("negazione"); 
		},

		'show scene room_day_dark',
		'wait 1500',
		async () => {
			SceneUtility.addBlur();
			await SceneFade.toHidden();
		},

		async () => {
			await BlinkOverlay.blink(400);
			await sleep(2000);
			await BlinkOverlay.doubleBlink(200);
			SceneUtility.removeBlur();
		},

		'wait 3500',

        'play sound phone_vibration',
		'play sound phone_notification',

        {'Function': {
            'Apply': function () {
                PhoneUI.reset();
                // Imposta il mittente senza aprire il telefono: vedrai solo badge e lockscreen.
                PhoneUI.setContactName('Giulia');
                PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
                PhoneUI.vibrate();
                return true;
            },
            'Revert': function () {
                PhoneUI.hide();
                return true;
            }
        }},

        // PhoneChoice mostra questi pulsanti direttamente nella chat del telefono.
        {'PhoneChoice': {
            'Rispondi': {
                'Text': 'RISPONDI(WIP)',
				'Do': '',
				'Disabled': true          
            },
            'Ignora': {
                'Text': 'IGNORA',
                'Do': 'jump Negazione_Ignora'
            }
        }}
    ],

    'Negazione_Rispondi': [
        {'Function': {
            'Apply': function () {
                PhoneUI.addOutgoing('Oggi non ho le forze per uscire, scusami.');
                return true;
            },
            'Revert': function () {
                PhoneUI.reset();
                PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
                return true;
            }
        }},

        'play sound crash with volume 100',
        'show scene #300000 with fadeIn',
        // 'jump Esercizio_Respirazione'	DA IMPLEMENTARE
    ],

    'Negazione_Ignora': [
        {'Function': {
            'Apply': function () {
                PhoneUI.hide();
                return true;
            },
            'Revert': function () {
                // Anche tornando indietro non apriamo il telefono in automatico.
                PhoneUI.setContactName('Giulia');
                return true;
            }
        }},

        'wait 2000',
        'jump Secondo_Messaggio'
    ],

    'Secondo_Messaggio': [
        'play sound phone_vibration',
		'play sound phone_notification',

        {'Function': {
            'Apply': function () {
                PhoneUI.reset();
                // Nuovo messaggio: telefono chiuso, solo notifica/badge.
                PhoneUI.setContactName('Giulia');
                PhoneUI.addIncoming('Sai che può solo farti bene, hai bisogno di aria. Ti aspetto.');
                PhoneUI.vibrate();
                return true;
            },
            'Revert': function () {
                PhoneUI.hide();
                return true;
            }
        }},

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
			PhoneUI.hide();
		},
		'show scene #000000',
		() => SceneFade.toHidden(),
		// 'show scene #000000 with fadeIn',
		'wait 5000',
		'play sound phone_vibration',
		'play sound phone_notification',
		() => {
			PhoneUI.reset();
			// Messaggio in arrivo: aggiorna il badge, ma lascia il telefono chiuso.
			PhoneUI.setContactName('Giulia');
			PhoneUI.addIncoming('Non lasciarmi aspettare.');
			PhoneUI.vibrate();
		},

		{'PhoneChoice':{
			'Apri la porta': {
				'Text': 'APRI LA PORTA',
				'Do': 'jump Esci_Casa with fadeOut'
			}
		}}
	],

	'Esci_Casa':[
		async () => {
			PhoneUI.hide();
			await SceneFade.toVisible({
				color: '#fff'
			})
			SceneUtility.emptyScene();
		},

		'show scene outside',
		async () => {
			SceneUtility.addBlur();
			await SceneFade.toHidden({duration: 2});
		},
		
		'wait 3000',
		
		async () => {
			await BlinkOverlay.blink(400);
			SceneUtility.removeBlur();
			await sleep(2000);
			await BlinkOverlay.blink(200);
			await BlinkOverlay.closeLid(200);
			await sleep(1000);
		},
		
		'show scene feet',

		async () => {
			await BlinkOverlay.openLid(400);
			await sleep (3000);
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
			await SceneFade.toVisible();
			SceneUtility.loadScene("rabbia");
		},
		'show scene room_rage',
		'wait 1500',
		async() => await SceneFade.toHidden(),
		'play music rage_scene with loop volume 75',

		'wait 2000',

		'play sound phone_vibration',
		'play sound phone_notification',
		() => {
			PhoneUI.reset();
			// Prepariamo mittente e notifica; il giocatore aprira' il telefono dal pulsante.
			PhoneUI.setContactName('Giulia');
			PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
			PhoneUI.vibrate();
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
		// 	AcceleratingClock.stopClock = AcceleratingClock.startAcceleratingClock('clock-display');
		// },

		// 'wait 10000',

		// async () => {
		// 	if(AcceleratingClock.stopClock) AcceleratingClock.stopClock();
		// 	document.getElementById('clock-display').style.display = 'none';
		// },

		'wait 3000',
		() => {
			PhoneUI.reset();
			PhoneUI.show();
		},

		// Mostriamo il comando come azione del telefono e poi scriviamo il messaggio scelto.
		{'PhoneChoice':{
			'Nuovo messaggio': {
				'Text': 'NUOVO MESSAGGIO',
				'Do': 'wait 2000',
				'onChosen': function() {
					PhoneUI.addOutgoing('Ehi');
				}
			}
		}},

		async () => {
			PhoneUI.reset();
			PhoneUI.hide();

			await sleep(1000);

			PhoneUI.show('Messaggi');
			PhoneUI.addNotification(
				{
					title: 'Messaggi',
					body: 'Nessun nuovo messaggio'
				}, false);		
								
			await sleep(3000);
			PhoneUI.hide();
		},

		'stop music',
		'jump Contrattazione'
	],
//CONTRATTAZIONE
	'Contrattazione': [
		async () => {
			await SceneFade.toVisible();
			SceneUtility.loadScene("contrattazione");

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
			SceneUtility.loadScene("depressione");
		},
		'show scene room_night',
		'play music rain with loop volume 30',
		'wait 1500',
		async () => await SceneFade.toHidden({duration: 3.5}),

		'wait 5000',
		'play sound phone_vibration',
		'play sound phone_notification',
		async () => {
			PhoneUI.reset();
			PhoneUI.addIncoming('Oggi è più difficile degli altri giorni, non devi essere sempre forte. Va bene anche così');

			// Wait until the player opens the phone and reads the notification
			// (the PhoneUI marks notifications as read when the chat is opened),
			// then give an extra 4.5s for reading before continuing.
			await PhoneUI.waitUntilAllNotificationsRead(20000);
			await sleep(5000);
			PhoneUI.hide();
		},

		'wait 2000',
		
		async() => {
			await SceneFade.toVisible({duration: 0.25});
			SceneUtility.emptyScene();
		},
		'show scene auto',
		async() => await SceneFade.toHidden({duration: 0.25}),
		'play sound crash',

		'wait 10000',
		'pause music',
		async() => await SceneFade.toVisible({duration: 0.25}),
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
		'play music rain with loop volume 30',

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
		'shadow Tu contavi e io trovato sempre un posto dove nascondermi',

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
			SceneUtility.loadScene("rabbia");
		},
		'show scene room_rage',
		'wait 1500',
		async() => await SceneFade.toHidden(),
		'play music rage_scene with loop volume 75',

		'jump Glitch_Rabbia'
	],

	//DA RIFARE COMPLETAMENTE
	'Accettazione': [
	// 	() => SceneUtility.loadScene("accettazione"),
	// 	'show scene room_day_normal',
	// 	'wait 1500',
	// 	() => SceneUtility.revealPreparedScene(),

	// 	'wait 5000',
		
	// 	'play sound phone_vibration',
	// 	'play sound phone_notification',

    //     {'Function': {
    //         'Apply': function () {
    //             PhoneUI.reset();
    //             // Imposta il mittente senza aprire il telefono: vedrai solo badge e lockscreen.
    //             PhoneUI.setContactName('Giulia');
    //             PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
    //             PhoneUI.vibrate();
    //             return true;
    //         },
    //         'Revert': function () {
    //             PhoneUI.hide();
    //             return true;
    //         }
    //     }},

    //     // PhoneChoice mostra questi pulsanti direttamente nella chat del telefono.
    //     {'PhoneChoice': {
    //         'Rispondi': {
    //             'Text': 'RISPONDI',
	// 			'Do': 'jump Finale'          
    //         },
    //         'Ignora': {
    //             'Text': 'IGNORA',
    //             'Do': '',
	// 			'Disabled': true
    //         }
    //     }}
	// ],

	// 'Finale': [
	// 	() => {
	// 		PhoneUI.hide();
	// 		SceneUtility.emptyScene();
	// 		SceneUtility.enableBackground();
	// 	},
	// 	'show scene end with fadeIn duration 5s',
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

			PhoneUI.vibrate(600);
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
