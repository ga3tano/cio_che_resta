/**
 * =======================================
 * Engine Settings
 *
 * Do not modify the ones marked with a *
 * Unless you know what you are doing
 * =======================================
 **/

'use strict';
/* global Monogatari */

const monogatari  = Monogatari.default;

monogatari.settings({

	// The name of your game, this will be used to store all the data so once
	// you've released a game using one name, it shouldn't change. Please use the
	// Version Setting to indicate a new release of your game!
	'Name': 'Ciò che resta',

	// The version of your game in semantic versioning (https://semver.org/).
	'Version': '0.1.0',

	// Initial Label *
	'Label': 'Tutorial',

	// Number of AutoSave Slots
	'Slots': 10,

	// Change to true for a MultiLanguage GameScreen.
	'MultiLanguage': false,

	// If the 'Multilanguage' setting is set to `true`. This will enable a
	// language selection screen that will be shown before the asset loading
	// screen. If set to false, the loading screen will appear first instead and
	// players will have to change the language from the settings screen.
	'LanguageSelectionScreen': true,

	// Music for the Main Menu.
	'MainScreenMusic': '',

	// Prefix for the Save Slots in Local Storage.
	'SaveLabel': 'Save',
	'AutoSaveLabel': 'AutoSave',

	// Turn main menu on/off; Default: true *
	'ShowMainScreen': true,

	// Turn image preloading on/off, Default: true
	'Preload': true,

	// Time interval between autosaves (In Minutes). Default: 0 (Off)
	'AutoSave': 0,

	// Enable service workers; Default: true *
	'ServiceWorkers': true,

	// The Aspect Ratio your background images are on. This only has effect on
	// web deployed novels if forceAspectRatio flag is on.
	'AspectRatio': '16:9',

	// Force aspect ratio, it will make all images to comply with aspect ratio.
	// Values: 'None' (don't force), 'Visuals' (force only visuals)
	// or 'Global' (force all game)
	'ForceAspectRatio': 'None',

	// Enables or disables the typing text animation for the whole game.
	'TypeAnimation': true,

	// Enables or disables instant text when moving the game forward.
	// Enabled - Text will instantly appear when the player moves the text forward.
	// Disabled - Text will appear at a rapid speed, ignoring pauses.
	'InstantText': true,

	// Enables or disables the typing text animation in NVL dialogs for the
	// whole game.
	'NVLTypeAnimation': true,

	// Enables or disables the typing animation for the narrator.
	// If the previous property was set to false, the narrator won't shown
	// the animation even if this is set to true.
	'NarratorTypeAnimation': true,

	// Enables or disables the typing animation for the special centered
	// character. If the TypeAnimation property was set to false, the centered
	// character won't show the animation even if this is set to true.
	'CenteredTypeAnimation': true,

	// Force some orientation on mobile devices. If this setting is set either
	// to portrait or landscape, a warning message will be displayed so the
	// player rotates its device.
	// Possible values: any, portrait or landscape.
	'Orientation': 'portrait',

	// Allow players to skip through the game. Similar to the auto play feature,
	// skipping will allow players to go through the game really fast.
	// If this value is set to 0, no skipping will be allowed but if it's set
	// to a higher number, skipping will be allowed and that value will be taken
	// as the speed in milliseconds with which the game will skip through the script
	'Skip': 0,

	// Define the directories where the assets are located. The root directory is
	// the holder for the other asset specific directories, this directories are
	// used when retrieving the files on the game.
	'AssetsPath': {
		'root': 'assets',
		'characters': 'characters',
		'icons': 'icons',
		'images': 'images',
		'music': 'music',
		'scenes': 'scenes',
		'sounds': 'sounds',
		'ui': 'ui',
		'videos': 'videos',
		'voices': 'voices',
		'gallery': 'gallery'
	},

	// Name of the Splash Screen Label. If a name is given and a label with that
	// name exists on the game's script, it will be used to show a splash screen
	// right after the loading screen.
	'SplashScreenLabel': '_SplashScreen',

	// Define what storage engine should be used to save the game data. *
	// Adapters Available:
	// - LocalStorage: This one is used by default
	// - SessionStorage: Same as LocalStorage but will be cleared when the page
	// 					 is closed.
	// - IndexedDB: The information is saved using the IndexedDB web API
	// - RemoteStorage: The information will be sent and retrieved from a given
	//					URL Endpoint providing a REST API.
	'Storage': {
		'Adapter': 'LocalStorage',
		'Store': 'GameData',
		'Endpoint': ''
	},

	// Whether players can go back to previous points of the game or not.
	// Default: true
	// If this is set to false, the "Back" button on the quick menu will not be
	// shown and the left arrow keyboard shortcut will be disabled.
	// Disattivato: il flusso a loop di polling (loop_torcia, loop_glitch, ...) e lo
	// stato custom (telefono, minigiochi, overlay) non sopravvivono a un rollback.
	'AllowRollback': false,

	// Whether experimental features should be enabled or not. Default: false
	// These features are unfinished and unstable, chances are they will still
	// go through a lot of changes and functionality won't have any backward
	// compatibility rendering your save files unusable on many cases.
	'ExperimentalFeatures': false
});

monogatari.translations({
	'Italian': {
		'AdvanceHelp':        'Per avanzare nel gioco, clicca o tocca lo schermo oppure premi la barra spaziatrice',
		'AllowPlayback':      'Clicca qui per consentire la riproduzione audio',
		'Audio':              'Audio',
		'AutoPlay':           'Auto',
		'AutoPlayButton':     'Attiva riproduzione automatica',
		'AutoPlaySpeed':      'Velocità riproduzione automatica',
		'Back':               'Indietro',
		'BackButton':         'Torna indietro',
		'Cancel':             'Annulla',
		'Close':              'Chiudi',
		'Confirm':            'Vuoi uscire?',
		'Credits':            'Crediti',
		'Delete':             'Elimina',
		'DialogLogButton':    'Mostra il registro dei dialoghi',
		'FullScreen':         'Schermo intero',
		'Gallery':            'Galleria',
		'Help':               'Aiuto',
		'Hide':               'Nascondi',
		'HideButton':         'Nascondi la casella di testo',
		'iOSAudioWarning':    'Le impostazioni audio non sono supportate su iOS',
		'KeyboardShortcuts':  'Scorciatoie da tastiera',
		'Language':           'Lingua',
		'Load':               'Carica',
		'LoadAutoSaveSlots':  'Salvataggi automatici',
		'LoadButton':         'Apri la schermata di caricamento',
		'Loading':            'Caricamento',
		'LoadingMessage':     'Attendi mentre le risorse vengono caricate',
		'LoadSlots':          'Partite salvate',
		'LocalStorageWarning':'Local Storage non disponibile in questo browser',
		'Log':                'Registro',
		'Music':              'Volume musica',
		'NewContent':         "Sono disponibili nuovi contenuti, ricarica la pagina per ottenere l'ultima versione",
		'NoSavedGames':       'Nessuna partita salvata',
		'NoAutoSavedGames':   'Nessun salvataggio automatico',
		'NoDialogsAvailable': 'Nessun dialogo disponibile. I dialoghi appariranno qui man mano che compaiono',
		'OK':                 'OK',
		'OrientationWarning': 'Ruota il dispositivo per giocare',
		'Overwrite':          'Sovrascrivi',
		'QuickButtons':       'Tasti del menu rapido',
		'QuickMenu':          'Menu rapido',
		'Quit':               'Esci',
		'QuitButton':         'Esci dal gioco',
		'Resolution':         'Risoluzione',
		'Save':               'Salva',
		'SaveButton':         'Apri la schermata di salvataggio',
		'SaveInSlot':         'Salva nello slot',
		'SelectYourLanguage': 'Seleziona la tua lingua',
		'Settings':           'Impostazioni',
		'SettingsButton':     'Apri le impostazioni',
		'Show':               'Mostra',
		'Skip':               'Salta',
		'SkipButton':         'Attiva modalità salto',
		'SlotDeletion':       'Sei sicuro di voler eliminare questo slot?',
		'SlotOverwrite':      'Sei sicuro di voler sovrascrivere questo slot?',
		'Sound':              'Volume effetti',
		'Start':              'Inizia',
		'Stop':               'Stop',
		'TextSpeed':          'Velocità testo',
		'Video':              'Volume video',
		'Voice':              'Volume voci',
		'Windowed':           'Finestra'
	}
});

// Initial Settings
monogatari.preferences ({

	// Initial Language for Multilanguage Games or for the Default GUI Language.
	'Language': 'Italian',

	// Initial Volumes from 0.0 to 1.
	'Volume': {
		'Music': 1,
		'Voice': 1,
		'Sound': 1,
		'Video': 1
	},

	// Initial resolution used for Electron, it must match the settings inside
	// the electron.js file. This has no effect on web deployed novels.
	'Resolution': '800x600',

	// Speed at which dialog text will appear
	'TextSpeed': 20,

	// Speed at which the Auto Play feature will show the next statement
	// It is measured in seconds and starts counting after the text is
	// completely displayed.
	'AutoPlaySpeed': 5
});