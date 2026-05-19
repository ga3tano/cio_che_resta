/* global monogatari */

// Persistent Storage Variable
monogatari.storage ({
	player: {
		name: ''
	},
	clickedObjects: [],
	allObjects:['obj1', 'obj2'],
	lastClickedObject: null,
	objectDescriptions: {
		obj1: "Descrizione oggetto 1, pappappero.",
		obj2: "Descrizione oggetto 2, pappapperollà."
	},
	frasiRabbia: {
		f1: "NO, NO, NO!",
		f2: "NON DOVEVA\nSUCCEDERE",
		f3: "È COLPA MIA",
		f4: "PERCHÉ?!",
		f5: "NON È\nGIUSTO!"
	},
	allClicked: false,
	torchInitialized: false,

});