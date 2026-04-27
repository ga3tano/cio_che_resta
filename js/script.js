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

});

// Define the videos used in the game.
monogatari.assets ('videos', {

});

// Define the images used in the game.
monogatari.assets ('images', {

});

// Define the backgrounds for each scene.
monogatari.assets ('scenes', {

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
		
		'centered Cosa tiene in vita una luce che non riesce più a farsi strada perchè soffocata da una nebbia densa e nera come pece?',
		'centered la soffocante sensazione di affondare le gambe nelle sabbie mobili, che ti trascinano giù, sempre più giù',
		'centered e tu ti dimeni e pensi che provare ad uscirne in questo modo sia il punto di rottura che ti permetterà di trascinare fuori i polpacci pesanti dal fango',
		'centered ma le sabbie mobili illudono e tu speri che la soluzione si alesi nella forma più semplice ai tuoi occhi',
		'centered per poi pietrificarti, nell’angosciante consapevolezza che l’unica cosa da fare è rallentare e aspettare e respirare appena.',
		'centered Le nubi, la pece, la sabbia, l’angoscia, la fiamma, l’attesa. l’inesorabile scorrere dei minuti che afferra e ti scuote e rimargina i segni del tempo, mentre tu affondi lentamente.',
		'centered Allora, dimmi, qual è la soluzione?',
		'centered Attendere inerme o dimenarsi nella speranza di un appiglio che sia salvezza?',
		

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