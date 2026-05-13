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

});

// Define the voice files used in the game.
monogatari.assets ('voices', {

});

// Define the sounds used in the game.
monogatari.assets ('sounds', {
	typewriter: 'typewriter.mp3',
	crash: 'crash.mp3'
});

// Define the videos used in the game.
monogatari.assets ('videos', {

});

// Define the images used in the game.
monogatari.assets ('images', {

});

// Define the backgrounds for each scene.
monogatari.assets ('scenes', {
	'room': 'room.jpeg',
	'room_red': 'room_red.jpeg',
	'room_green': 'room_green.jpeg',
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
		'jump Torcia',

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
		//'play sound breathing with loop volume 35',

		{
			'Choice': {
				'Respira': {
					'Text': 'RESPIRA',
					//'Do': 'stop sound breathing with fade 1'
					'Do': 'jump Negazione_Cellulare'
				}
			}
		},

		/*'show scene #f7f6f6 with fadeIn',
		'show notification Welcome',
		{
			'Input': {
				'Text': 'What is your name?',
				'Validation': function (input) {
					return input.trim ().length > 0;
				},
				'Save': function (input) {
					this.storage ({
						player: {
							name: input
						}
					});
					return true;
				},
				'Revert': function () {
					this.storage ({
						player: {
							name: ''
						}
					});
				},
				'Warning': 'You must enter a name!'
			}
		},
		'y Hi {{player.name}} Welcome to Monogatari!',
		{
			'Choice': {
				'Dialog': 'y Have you already read some documentation?',
				'Yes': {
					'Text': 'Yes',
					'Do': 'jump Yes'
				},
				'No': {
					'Text': 'No',
					'Do': 'jump No'
				}
			}
		}*/
	],

	'Negazione_Cellulare': [
        'show scene room with fadeIn',
        'play sound phone_vibration',
        'vibrate 200 100 200',

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
        'jump Esercizio_Respirazione'
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
                // 'Do': 'jump Esci_Casa'
            },
            'Rimani': {
                'Text': 'RIMANI A CASA',
                // 'Do': 'jump Rimani_A_Casa'
            }
        }}
    ],
	
	'loop_torcia': [
		{'Conditional': {
        	'Condition': function () {
            	const store = monogatari.storage();

            	if (store.clickedObjects.length === store.allObjects.length) {
                	return 'finito';
            	}

            	return 'ancora';
        	},

        	'finito': 'jump Continua',
        	'ancora': '',
    	}},
	],

	'Torcia': [
        'show scene room with fadeIn',
		() => {
			NightOverlay.showNight();
		},

		'centered <div style="color: #e5e5e5; font-style: italic; z-index: 2;">Non si vede nulla... forse meglio accendere la torcia.</div>',

		{'Function': {
			'Apply': function() {
				showClickableObjects();
				NightOverlay.showTorch();
				return true;
			}
		}},

		'jump loop_torcia',
	],

	'Continua': [
		'centered Ciao',
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