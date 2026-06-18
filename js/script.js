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
	crash: 'crash.mp3',
	phone_vibration: 'phone_vibration.mp3',
	phone_notification: 'phone_notification.mp3'
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
		name: '???',
		color: '#c9c9ff'
	},
	'dad': {
		name: 'Tu',
		color: '#ffffff'
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
			TypeCentered: `la soffocante sensazione di affondare le gambe nelle sabbie mobili, che ti trascinano giù, sempre più giù`
		},

		{
			TypeCentered: `e tu ti dimeni e pensi che provare ad uscirne in questo modo sia il punto di rottura che ti permetterà di trascinare fuori i polpacci pesanti dal fango`
		},

		{
			TypeCentered: `ma le sabbie mobili illudono e tu speri che la soluzione si palesi nella forma più semplice ai tuoi occhi`
		},

		{
			TypeCentered: `per poi pietrificarti, nell’angosciante consapevolezza che l’unica cosa da fare è rallentare e aspettare e respirare appena.`
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

		//() => PanicBreath.start(),
		//'wait 8000',

		{
			'Choice': {
				'Respira': {
					'Text': 'RESPIRA',
					//'Do': 'stop sound breathing with fade 1'
					'Do': 'jump Intermezzo_Respira',
				}
			}
		},
	],

	// Intermezzo_Respira — transizione tra l'attacco di panico e la scena Torcia.
	//
	// FLUSSO:
	//   1. PanicBreath.release() → avvia il rallentamento graduale del respiro affannato (audio + rate diminuiscono a ogni ciclo).
	//   2. wait 3500 → 3.5 secondi in cui si sente il respiro che rallenta creando un ponte sonoro tra panico e calma.
	//   3. BreathingGame.start() → ferma PanicBreath internamente e mostra il cerchio guidato. Monogatari attende la Promise (async/await) finché il giocatore non completa i cicli respiratori.

	'Intermezzo_Respira': [
		() => PanicBreath.release(),
		'wait 3500',
		// async/await è necessario: start() restituisce una Promise e Monogatari deve attenderne il completamento prima di proseguire con jump Torcia.
		async () => await BreathingGame.start(),
		'jump Torcia'
	],

//TORCIA
	'Torcia': [
		() => {
			SceneUtility.loadScene("torcia");
		},
		'show scene room_night with fadeIn',
		'wait 1500',
		() => {
			SceneUtility.revealPreparedScene();
			NightOverlay.showNight();
		},
		
		() => {
			// showClickableObjects();
			NightOverlay.showTorch();
		},

		'jump loop_torcia',
	],

	'DialogoTorcia_Pianta': [
		() => showTextbox(),
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
		() => showTextbox(),
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
		() => showTextbox(),
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
		() => showTextbox(),
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

        	'True': 'jump Continua',
        	'False': 'jump wait_torcia'
    	}},
	],

	'Continua': [
		// 'centered <div style="color: #e5e5e5; font-style: italic; z-index: 14 !important;">Si è fatta una certa ora...provo a riaddormentarmi.</div>',
		// () => NightOverlay.hideTorch(),
		'wait 2000',
		() => {
			NightOverlay.isFrozen = true;
			const wrapper = document.getElementById('details-wrapper');
			if(wrapper) wrapper.style.pointerEvents = 'none'
			showTextbox();
		},

		'dad È tardi...meglio dormire.',

		async () => {
			await BlinkOverlay.doubleBlink(600);
			SceneUtility.enableBackground();
			SceneUtility.emptyScene();
			hideTextBox();
			NightOverlay.hide();
		},
		'show scene #000000 with fadeIn',
		'wait 3000',
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
        () => SceneUtility.loadScene("negazione"),
		'show scene room_day_dark',
		'wait 1500',
		() => SceneUtility.revealPreparedScene(),
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
		() => SceneUtility.emptyScene(),
		'show scene #000000 with fadeIn',
		() => PhoneUI.hide(),
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

			SceneUtility.toggleBackground();
		},

		{'PhoneChoice':{
			'Apri la porta': {
				'Text': 'APRI LA PORTA',
				'Do': 'jump Esci_Casa with fadeOut'
			}
		}}
	],

	'Esci_Casa':[
		() => {
			PhoneUI.hide();
			SceneUtility.emptyScene();
		},

		'show scene outside with fadeIn',
		() => SceneUtility.enableBackground(),
		
		'wait 3000',
		
		() => BlinkOverlay.doubleBlink(400),
		
		'show scene feet with fadeIn',

		'wait 4000',

		{'Choice':{
			'Torna a casa':{
				'Text': 'TORNA A CASA',
				'Do': 'jump Rabbia with fadeOut'
			}
		}}
	],
	

//RABBIA
	'Rabbia': [
		() => SceneUtility.loadScene("rabbia"),
		'show scene room_rage',
		'wait 1500',
		() => SceneUtility.revealPreparedScene(),
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

		'show scene #000000 with fadeIn',
		'jump Contrattazione'
	],
//CONTRATTAZIONE
	'Contrattazione': [
		() => SceneUtility.loadScene("contrattazione"),
		'show scene room_day_dark',
		'wait 1500',
		() => SceneUtility.revealPreparedScene(),

		async () => await SceneUtility.endClickedItems(),

		'wait 3000',
		
		'play sound phone_vibration',
		'play sound phone_notification',
		
		async () => {
			PhoneUI.reset();
			// Qui il telefono si apre perche' il giocatore sta gia scrivendo una chat attiva.
			// Non e' una notifica passiva: vogliamo mostrare la conversazione sul momento.
			PhoneUI.show('Giulia', { mode: 'chat' });
			PhoneUI.addOutgoing("Ehi, ti va se ci prendiamo un caffè?");

			// notify:false evita badge/lockscreen per una risposta gia visibile in chat.
			PhoneUI.addIncoming("Volentieri! Ci troviamo al solito posto tra 15 min", {
				notify: false
			});
			await sleep(6000);
			PhoneUI.reset();
			PhoneUI.hide();
		},

		//Monologo
		'show scene #000000 with fadeIn',
		'wait 1500',

		'jump Depressione'
	],

//DEPRESSIONE
	'Depressione': [
		() => SceneUtility.loadScene("depressione"),
		'show scene room_night with fadeIn',
		'play music rain with loop volume 30',
		'wait 1500',
		() => SceneUtility.revealPreparedScene(),

		'wait 3000',
		() => SceneUtility.emptyScene(),
		'show scene teddybear with fadeIn',
		'play sound crash',
		'wait 3000',
		'show scene #000000 with fadeIn duration 2s',

		() => SceneUtility.loadScene("depressione"),
		'show scene room_night with fadeIn',
		'play music rain with loop volume 30',

		() => {
			SceneUtility.revealPreparedScene();
			SceneUtility.addShadow();
		},
		async () => await SceneUtility.endClickedItems(),
		
		() => showTextbox(),
		'wait 1000',
		'shadow inserire dialogo incidente',
		
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
		'dad dialogo lascia andare',
		
		'show scene #000000 with fadeIn',
		'wait 3000', 
		'jump Accettazione'
	],

	'Non_Pronto': [
		'dad dialogo non pronto',

		'show scene #000000 with fadeIn',
		'wait 3000',

		() => SceneUtility.loadScene("rabbia"),
		'show scene room_rage',
		'wait 1500',
		() => SceneUtility.revealPreparedScene(),
		'play music rage_scene with loop volume 70',

		'jump Glitch_Rabbia'
	],

	'Accettazione': [
		() => SceneUtility.loadScene("accettazione"),
		'show scene room_day_normal',
		'wait 1500',
		() => SceneUtility.revealPreparedScene(),

		'wait 5000',
		
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
                'Text': 'RISPONDI',
				'Do': 'jump Finale'          
            },
            'Ignora': {
                'Text': 'IGNORA',
                'Do': '',
				'Disabled': true
            }
        }}
	],

	'Finale': [
		() => {
			PhoneUI.hide();
			SceneUtility.emptyScene();
			SceneUtility.enableBackground();
		},
		'show scene end with fadeIn duration 5s',
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
