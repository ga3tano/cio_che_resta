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
	frasiRabbia: [
		"NO, NO, NO!",
		"NON DOVEVA SUCCEDERE!",
		"DOVEVO PROTEGGERTI",
		"È COLPA MIA!",
		"PERCHÉ?!",
		"NON È GIUSTO!",
		"DOVEVO ESSERCI IO!"
	],
	allClicked: false,
	torchInitialized: false,

});