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
});


// Define the Characters
monogatari.characters ({
	/*'y': {
		name: 'Yui',
		color: '#5bcaff'
	}*/
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

		{
			TypeCentered: `Allora, dimmi, qual  è la soluzione?`
		},

		{
			TypeCentered: `Attendere inerme o dimenarsi nella speranza di un appiglio che sia salvezza?`
		},

		'show scene #666666 with fadeIn',
		() => {PanicBreath.start();},

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

	'Intermezzo_Respira': [
		//Avvio rilascio del respiro
		() => PanicBreath.release(),
		'wait 8000',

		'jump Negazione_Cellulare'
	],

	// 'Test':[
	// 	() => SceneWithSky.loadSky("giorno_2"),
	// 	'show scene room_day_dark',
	// 	() => SceneWithSky.revealPreparedScene(),
	// ],

	'Negazione_Cellulare': [
        () => SceneWithSky.loadSky("notte"),
		'show scene room_night',
		() => SceneWithSky.revealPreparedScene(),
        'play sound phone_vibration',
		'play sound phone_notification',
        'vibrate 20000',

        {'Function': {
            'Apply': function () {
                PhoneUI.reset();
                PhoneUI.show('Giulia');
                PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
                PhoneUI.vibrate();
                return true;
            },
            'Revert': function () {
                PhoneUI.hide();
                return true;
            }
        }},

        {'Choice': {
            'Rispondi': {
                'Text': 'RISPONDI',
                'Do': 'jump Negazione_Rispondi'
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
                PhoneUI.show('Giulia');
                return true;
            }
        }},

        'wait 2000',
        'jump Secondo_Messaggio'
    ],

    'Secondo_Messaggio': [
        'play sound phone_vibration',
		'play sound phone_notification',
        'vibrate 200 100 200',

        {'Function': {
            'Apply': function () {
                PhoneUI.reset();
                PhoneUI.show('Giulia');
                PhoneUI.addIncoming('Sai che può solo farti bene, hai bisogno di aria. Ti aspetto.');
                PhoneUI.vibrate();
                return true;
            },
            'Revert': function () {
                PhoneUI.hide();
                return true;
            }
        }},

        {'Choice': {
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
		'show scene #000000 with fadeIn',
		() => {PhoneUI.hide();},
		// 'show scene #000000 with fadeIn',
		'wait 5000',
		'play sound phone_vibration',
		'play sound phone_notification',
        'vibrate 200 100 200',
		() => {
			PhoneUI.reset();
			PhoneUI.show('Giulia');
			PhoneUI.addIncoming('Non lasciarmi aspettare.');
			PhoneUI.vibrate();

			SceneWithSky.toggleBackground();
		},

		{'Choice':{
			'Apri la porta': {
				'Text': 'APRI LA PORTA',
				'Do': 'jump Esci_Casa with fadeOut'
			}
		}}
	],

	'Esci_Casa':[
		() => PhoneUI.hide(),
		'show scene outside with fadeIn',
		() => SceneWithSky.enableBackground(),
		
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
	
	'loop_torcia': [
		{'Conditional': {
        	'Condition': function () {
            	const store = monogatari.storage();
				return store.clickedObjects.length === store.allObjects.length;
        	},

        	'True': 'jump Continua with fadeOut',
        	'False': 'jump wait_torcia'
    	}},
	],

	'wait_torcia': [
		'wait 300',
		'jump loop_torcia'
	],

	'Torcia': [
        'show scene room_night with fadeIn',
		() => NightOverlay.showNight(),

		'centered <div style="color: #e5e5e5; font-style: italic; z-index: 14 !important;">Non si vede nulla... forse meglio accendere la torcia.</div>',

		() => {
			showClickableObjects();
			NightOverlay.showTorch();
		},

		'jump loop_torcia',
	],

	'Continua': [
		'centered <div style="color: #e5e5e5; font-style: italic; z-index: 14 !important;">Si è fatta una certa ora...provo a riaddormentarmi.</div>',
		() => NightOverlay.hideTorch(),

		'show scene #000000 with fadeIn',

		() => {
			NightOverlay.hide();
			hideClickableObjects();
		},
		'wait 2000',
		'show scene room with fadeIn',
		{
			TypeCentered : `Buongiornissimo, caffè?`
		}
	],

//RABBIA

	'Rabbia': [
		() => SceneWithSky.loadSky("nuvolo"),
		'show scene room_rage',
		() => 	SceneWithSky.revealPreparedScene(),

		'wait 2000',

		() => { 	
			PhoneUI.reset();
			PhoneUI.show('Giulia');
			PhoneUI.addIncoming('So che è difficile, ma sono qui. Andiamo a prendere un caffè?');
			PhoneUI.vibrate();
		},

		{'Choice':{
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
		'centered <div style="color: #e5e5e5; font-style: italic; z-index: 14 !important;">...</div>'
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