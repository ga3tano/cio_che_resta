

monogatari.script({
    'negazione': [
        'show scene negazione widh fadeIn',
        'window hide',

        'centered <div style="color: #888; font-style: italic;">Non si vede nulla... forse meglio accendere la torcia.</div>',

        //attendi 2 secondi, poi accendi la torcia automaticamente
        'wait 2',

        {
            'Function': () => {
   
                    //accendi la torica
                    attivaTorcia();

                    monogatari.message('<div style="color: #ffaa00;">Il fascio di luce rivela una stanza polverosa.</div>')
            }
        }
    ]
})