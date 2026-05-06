//Blocco gestione torcia
function attivaTorcia(){
    const torcia = document.getElementById('torcia');

    if(torcia){
        torcia.style.display = 'block';
        torciaAttiva = true;
        document.addEventListener('mousemove', aggiornaTorcia);
    }
}

function disattivaTorcia(){
    const torcia = document.getElementById('torcia');
    if(torcia) {
        torcia.style.display = 'none';
        torciaAttiva = false;
        document.removeEventListener('mousemove', aggiornaTorcia);
    }
}

function aggiornaTorcia(e) {
    const torcia = document.getElementById('torcia');
    if(torcia && torciaAttiva) {
        const x = e.clientX;
        const y = e.clinetY;
        torcia.style.background = `radial-gradient(circle at ${x}px ${y}px, trasparent 0%, transparent 70px, rgba(0,0,0,0.95) 180px)`;
    }
}