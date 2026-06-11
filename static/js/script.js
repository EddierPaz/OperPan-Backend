// navegacion
function navegar() {
    const ruta = document.getElementById("_nav").value;
    if (ruta !== "") {
        window.location.href = ruta;
    }
}

// Cerrar Sesion  
function cerrarSesion() {
    window.location.href = "/OperPan/index.html";
}

