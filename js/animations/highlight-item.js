class HighlightItem extends Monogatari.Component
{
    static id = 'highlighted-item'; //Identificativo componente

    static defaults = {
        src: '',
        xPercent: 0,
        yPercent: 0,
        sizePercent: 0,
        sizeReference: 'width',  //a cosa si riferisce sizePercent
        raiseScale: 1.1,
        raiseShadow: '0 8px 20px rgba(0,0,0,0.6)', //ombra in rilievo, vedere se utilizzare
        outlineFilteredId: 'contour-outline',   //id filtro SVG definito in index nel DOM
        parentSelector: 'monogatari',   //da cambiare in #scene-layer se vogliamo introdurre scorrimento orizzontale della scena
        onClick: null
    };

    init(options){
        this.props = {...HighlightItem.defaults, ...options};
        
        //Creo elemento
        this.el = document.createElement('img');
        this.el.src = this.props.src;
        this.el.style.position = 'absolute';
        this.el.minHeight = '44px'; //dimensioni minime per hitbox anche nei dispositivi più piccoli
        this.el.minWidth= '44px';
        this.el.style.transition ='transform 0.2s, filter 0.2s';
        this.el.style.willChange = 'transform, filter';
        
        //Carico l'immagine per conoscere le dimensioni naturali
        this._naturalWidth = null;
        this._naturalHeight = null;

        this.el.addEventListener('load', () =>{
            this._naturalWidth = this.el.naturalWidth;
            this._naturalHeight = this.el.naturalHeight;
            this.recalc(); //ricalcola una volta note le proporzioni
        });

        // -- approccio con coordinate responsive
        this._raise = () => {
            this.el.style.transform = 'scale(${this.props.raiseScale})';
            this.el.style.filter = 'url(#${this.props.outlineFilterId})';
            this.el.style.zIndex = '10';
        }

        this._reset = () => {
            this.el.style.transform = 'scale(1)';
            this.el.style.filter = 'none';
            this.el.style.zIndex = '';
        }

        //Events listeners mouse e touch
        this.el.addEventListener('mouseEnter', this._raise);
        this.el.addEventListener('mouseLeave', this._reset);
        
        this.el.addEventListener('touchStart', e => {
            e.preventDefault();
            this._raise();
        });
        
        this.el.addEventListener('touchEnd', this._reset);
        this.el.addEventListener('touchCancel', this._reset);

        // Click/tap
        if (this.props.onClick) {
            this.el.addEventListener('click', () => {
                // Se onClick è un'azione stringa per lo script di Monogatari
                if (typeof this.props.onClick === 'string') {
                    Monogatari.run(this.props.onClick);
                } 
                else if (typeof this.props.onClick === 'function') {
                    this.props.onClick();
                }
            });
        }

        // Aggiunge l'elemento alla scena (se il componente è attaccato a un elemento, usa this.element)
        // In questo caso preferiamo appenderlo al contenitore principale del gioco.
        this._parent = document.querySelector('monogatari');
        
        if (this._parent){
            this._parent.appendChild(this.el);
        
            //Fermarsi qui e commentare il codice seguente per approccio con coordinate fisse
            this.recalc();

            //Ricalcolo al resize della finestra (forse superfluo, valutare)
            this._resizeHandler = () => this.recalc();
            window.addEventListener('resize', this._resizeHandler);
           
            // Ricalcola se il genitore cambia dimensioni (es. scorrimento futuro)
            if(window.ResizeObserver){
                this._ro = new ResizeObserver(() => this.recalc());
                this._ro.observe(this._parent);
            }
        }     
    }

    recalc() {
        if(!this._parent) return;   //evito chiamate accidentali
        const pw = this._parent.offsetWidth;
        const ph = this._parent.offsetheight;

        //Posizionamento
        this.el.style.left = (this.props.xPercent / 100) * pw + 'px';
        this.el.style.top = (this.props.yPercent / 100) * pw + 'px';

        //Dimensionamento
        if(this.props.sizePercent > 0 && this._naturalWidth && this._naturalHeight){
            if (this.props.sizeReference === 'height') {
                const targetHeight = (this.props.sizePercent / 100) * ph;
                this.el.style.height = targetHeight + 'px';
                this.el.style.width = 'auto';
            }
            else {
                const targetWidth = (this.props.sizePercent / 100) * pw;
                this.el.style.width = targetWidth + 'px';
                this.el.style.height = 'auto';
            }
        }
        else{
            // Dimensioni naturali, ma evitiamo overflow
            this.el.style.width = 'auto';
            this.el.style.height = 'auto';
            this.el.style.maxWidth = '100%';
            this.el.style.maxHeight = '100%';
        }
    }

    onDestroy() {
        // Rimuove gli eventi e l'elemento dal DOM
        this.el.removeEventListener('mouseEnter', this._raise);
        this.el.removeEventListener('mouseLeave', this._reset);
        this.el.removeEventListener('touchStart', this._raise);
        this.el.removeEventListener('touchEnd', this._reset);
        this.el.removeEventListener('touchCancel', this._reset);
        window.removeEventListener('resize', this._resizeHandler);
        if(this.ro) this._ro.disconnect();
        this.el.remove();
    }
}

Monogatari.registerComponent(HighlightItem);

