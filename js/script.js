/**
 * Plataforma de Gestión de Eventos (COSMO BEAUTY)
 * Lógica POO avanzada (ES6+): Encapsulación, Herencia, Polimorfismo.
 * Incluye la funcionalidad: Clic en Tarjeta -> Abre Modal -> Muestra Botón de Registro/Pago.
 */

// =========================================================
// 1. CLASES POO
// =========================================================
class Evento {
    #id; #nombre; #fecha; #ubicacion; #costo; #descripcion; #imagen; #inscritos = 0; 
    constructor(id, nombre, fecha, ubicacion, costo, descripcion, imagen) {
        this.#id = id; this.#nombre = nombre; this.#fecha = fecha; 
        this.#ubicacion = ubicacion; this.#costo = costo; this.#descripcion = descripcion;
        this.#imagen = imagen; 
    }
    getId() { return this.#id; }
    getNombre() { return this.#nombre; }
    getCosto() { return this.#costo; }
    getFecha() { return this.#fecha; }
    getUbicacion() { return this.#ubicacion; }
    getDescripcion() { return this.#descripcion; }
    getImagen() { return this.#imagen; } 
    mostrarCosto() { return `Precio: S/ ${this.#costo.toFixed(2)}`; }
    requierePago() { return this.#costo > 0; }
    incrementarInscritos() { this.#inscritos++; }
    decrementarInscritos() { if (this.#inscritos > 0) { this.#inscritos--; } }
}

class EventoGratuito extends Evento {
    constructor(id, nombre, fecha, ubicacion, descripcion, imagen) {
        super(id, nombre, fecha, ubicacion, 0, descripcion, imagen); 
    }
    mostrarCosto() { return "¡GRATUITO!"; }
    requierePago() { return false; }
}

class EventoPago extends Evento {
    constructor(id, nombre, fecha, ubicacion, costo, descripcion, imagen) {
        super(id, nombre, fecha, ubicacion, costo, descripcion, imagen);
    }
    mostrarCosto() {
        const costo = super.getCosto(); 
        return `S/ ${costo.toFixed(2)} (Pago Requerido)`;
    }
}

// NUEVA CLASE PARA GESTIONAR EL ESTADO DE PAGO DE CADA INSCRIPCIÓN
class Inscripcion {
    #eventoId; #pagado;

    constructor(eventoId, pagado = false) {
        this.#eventoId = eventoId;
        this.#pagado = pagado;
    }
    getEventoId() { return this.#eventoId; }
    esPagado() { return this.#pagado; }
    marcarComoPagado() { this.#pagado = true; }
}

class Usuario {
    #id; #nombre; #email; #password; #inscripciones = []; 

    constructor(id, nombre, email, password, inscripciones = []) {
        this.#id = id; this.#nombre = nombre; this.#email = email; this.#password = password;
        // Mapea la data persistida a objetos Inscripcion
        this.#inscripciones = inscripciones.map(i => 
            i instanceof Inscripcion ? i : new Inscripcion(i.eventoId, i.pagado)
        );
    }
    
    getId() { return this.#id; }
    getNombre() { return this.#nombre; }
    getEmail() { return this.#email; }
    getPassword() { return this.#password; }
    getInscripciones() { return this.#inscripciones; }
    
    // [MODIFICACIÓN]: Nuevo método para actualizar el nombre
    setNombre(nuevoNombre) {
        this.#nombre = nuevoNombre;
    }
    // [FIN MODIFICACIÓN]
    
    getInscripcionPorId(eventoId) {
        return this.#inscripciones.find(i => i.getEventoId() === eventoId);
    }
    
    inscribirAEvento(eventoId) {
        if (!this.getInscripcionPorId(eventoId)) {
            this.#inscripciones.push(new Inscripcion(eventoId)); 
            return true;
        }
        return false; 
    }
    
    cancelarInscripcion(eventoId) {
           this.#inscripciones = this.#inscripciones.filter(i => i.getEventoId() !== eventoId);
    }
    
    // MÉTODO PARA MARCAR PAGO
    marcarPago(eventoId) {
        const inscripcion = this.getInscripcionPorId(eventoId);
        if (inscripcion) {
            inscripcion.marcarComoPagado();
            return true;
        }
        return false;
    }
}

class PlataformaEventos {
    #listaEventos = []; #listaUsuarios = []; #usuarioLogueado = null;
    #nextUserId = 103; 

    constructor(eventosIniciales, usuariosIniciales) {
        this.#listaEventos = eventosIniciales; 
        
        const usuariosPersistidos = this.#cargarUsuarios();
        this.#listaUsuarios = usuariosPersistidos.length > 0 ? usuariosPersistidos : usuariosIniciales;
        
        this.#usuarioLogueado = this.#cargarSesion(); 

        const maxId = this.#listaUsuarios.reduce((max, user) => Math.max(max, user.getId()), 102);
        this.#nextUserId = maxId + 1;
    }
    
    #cargarSesion() {
        const loggedInEmail = localStorage.getItem('cosmoBeautyLoggedInUser');
        if (loggedInEmail) {
            const usuario = this.#listaUsuarios.find(user => user.getEmail() === loggedInEmail);
            return usuario || null;
        }
        return null;
    }
    
    #guardarSesion(email) {
        if (email) {
            localStorage.setItem('cosmoBeautyLoggedInUser', email);
        } else {
            localStorage.removeItem('cosmoBeautyLoggedInUser');
        }
    }

    #cargarUsuarios() {
        const data = localStorage.getItem('cosmoBeautyUsuarios');
        if (data) {
            const rawUsers = JSON.parse(data);
            return rawUsers.map(u => new Usuario(u.id, u.nombre, u.email, u.password, u.inscripciones));
        }
        return [];
    }

    // FUNCIÓN MODIFICADA PARA GUARDAR EL ESTADO DE PAGO
    #guardarUsuarios() {
        const usersPlain = this.#listaUsuarios.map(user => ({
            id: user.getId(),
            nombre: user.getNombre(),
            email: user.getEmail(),
            password: user.getPassword(),
            // Guarda el ID y el estado de pago de cada inscripción
            inscripciones: user.getInscripciones().map(i => ({
                eventoId: i.getEventoId(),
                pagado: i.esPagado()
            }))
        }));
        localStorage.setItem('cosmoBeautyUsuarios', JSON.stringify(usersPlain));
    }
    
    // MÉTODO EXPUESTO PARA GUARDAR DESDE FUERA (USADO EN MANEJAR PAGO)
    guardarUsuarios() {
        this.#guardarUsuarios();
    }
    
    getEventos() { return this.#listaEventos; }
    getEvento(id) { return this.#listaEventos.find(e => e.getId() === id); } 
    getUsuarioLogueado() { return this.#usuarioLogueado; }

    validarLogin(email, password) {
        const usuarioEncontrado = this.#listaUsuarios.find(user => 
            user.getEmail() === email && user.getPassword() === password
        );
        if (usuarioEncontrado) {
            this.#usuarioLogueado = usuarioEncontrado; 
            this.#guardarSesion(email);
            return true;
        }
        return false;
    }

    cerrarSesion() { 
        this.#usuarioLogueado = null; 
        this.#guardarSesion(null);
    }
    
    // [MODIFICACIÓN]: Nuevo método para editar el nombre del usuario logueado
    editarNombreUsuario(nuevoNombre) {
        if (!this.#usuarioLogueado) {
            return false; // No hay usuario logueado para editar
        }

        const usuarioEditado = this.#listaUsuarios.find(u => u.getId() === this.#usuarioLogueado.getId());
        
        if (usuarioEditado) {
            // 1. Actualizar el nombre en la instancia de Usuario (setNombre)
            usuarioEditado.setNombre(nuevoNombre); 
            
            // 2. Persistir todos los usuarios con el cambio
            this.#guardarUsuarios(); 
            
            // 3. Actualizar la sesión para que el nombre se refleje inmediatamente
            this.#guardarSesion(usuarioEditado.getEmail()); 
            
            // 4. Actualizar la variable local de la clase PlataformaEventos
            this.#usuarioLogueado = usuarioEditado; 
            
            return true;
        }
        return false;
    }
    // [FIN MODIFICACIÓN]

    registrarNuevoUsuario(nombre, email, password) {
        if (this.#listaUsuarios.find(user => user.getEmail() === email)) {
            return { success: false, message: "Error: El correo electrónico ya está registrado." };
        }
        
        const nuevoUsuario = new Usuario(this.#nextUserId++, nombre, email, password);
        this.#listaUsuarios.push(nuevoUsuario);
        this.#guardarUsuarios(); 

        return { success: true, message: "Registro exitoso." };
    }
    
    registrarUsuarioAEvento(eventoId) {
        if (!this.#usuarioLogueado) { return false; }
        const evento = this.#listaEventos.find(e => e.getId() === eventoId);

        if (evento && this.#usuarioLogueado.inscribirAEvento(eventoId)) {
            evento.incrementarInscritos(); 
            this.#guardarUsuarios(); 
            return true;
        }
        return false;
    }

    cancelarInscripcionAEvento(eventoId) {
        if (!this.#usuarioLogueado) { return false; }
        const evento = this.#listaEventos.find(e => e.getId() === eventoId);
        this.#usuarioLogueado.cancelarInscripcion(eventoId);
        if (evento) { evento.decrementarInscritos(); }
        this.#guardarUsuarios(); 
        return true;
    }
    
    obtenerEventosInscritos() {
        if (!this.#usuarioLogueado) { return []; }
        const inscritosIDs = this.#usuarioLogueado.getInscripciones().map(i => i.getEventoId());
        return this.#listaEventos.filter(evento => inscritosIDs.includes(evento.getId()));
    }
}

// =========================================================
// 2. INICIALIZACIÓN DE DATOS (Mocks)
// =========================================================
const basePath = 'imagenes/'; 
const eventosData = [
    // MASTERCLASS -> evento1.jpg
    new EventoPago(1, "Masterclass de Contorno & Iluminación", "2026-03-15", "Auditorio Central", 120.00, "Técnicas avanzadas de contorno y strobing con productos de lujo.", basePath + "evento1.jpg"),
    
    // WORKSHOP -> evento2.png 
    new EventoGratuito(2, "Workshop de Skincare Coreano", "2026-04-01", "Sala Virtual - Zoom", "Rutina completa de 10 pasos para una piel de porcelana.", basePath + "evento2.png"),
    
    // CENA -> evento3.png 
    new EventoPago(3, "Cena de Networking y Belleza", "2026-04-20", "Hotel The Luxury", 25.00, "Un encuentro para conectar con maquilladores y bloggers de belleza. Incluye cóctel.", basePath + "evento3.png"),
    
    // SESIÓN CEJAS -> evento4.png 
    new EventoGratuito(4, "Sesión de Cejas Perfectas", "2026-05-10", "Tienda GLAMOUR", "Aprende a diseñar y rellenar tus cejas como una profesional.", basePath + "evento4.png"), 
];

const usuariosData = []; 
// La instancia de la aplicación ahora debe ser global para ser usada por 'perfil.html'
const app = new PlataformaEventos(eventosData, usuariosData); 
const CODIGO_PAGO_GLOBAL = 'CC123456'; 

// =========================================================
// 3. FUNCIONES DE MANEJO DEL DOM (Interfaz Dinámica)
// =========================================================

function validarFormatoEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    return regex.test(email);
}

// Función para abrir el modal de detalles y mostrar el botón de registro/pago
function mostrarDetallesModal(eventoId) {
    const evento = app.getEvento(eventoId);
    const usuarioLogueado = app.getUsuarioLogueado();
    const modal = document.getElementById('detallesModal');
    const modalContent = document.getElementById('detallesModalContent');

    if (!evento || !modal || !modalContent) return;

    const inscripcion = usuarioLogueado ? usuarioLogueado.getInscripcionPorId(evento.getId()) : null;
    const estaInscrito = !!inscripcion;
    const pagoConfirmado = estaInscrito && inscripcion.esPagado();

    let buttonHTML = '';

    if (!usuarioLogueado) {
        // Opción 1: No logueado -> Botón de iniciar sesión
        buttonHTML = `<button class="btn-primary" onclick="mostrarLoginModal()">Iniciar Sesión para Registrarse</button>`;
    } else if (estaInscrito) {
        if (evento.requierePago() && !pagoConfirmado) {
             // Opción 2: Logueado e inscrito con pago pendiente -> Botón de pago
             buttonHTML = `
                 <div class="pago-info-modal">
                     <p class="pago-pendiente">¡Inscrito! **Pago Pendiente**</p>
                     <button 
                         data-id="${evento.getId()}" 
                         class="btn-pago-modal btn-primary" 
                         data-codigo="${CODIGO_PAGO_GLOBAL}"
                     >
                         Hacer pago con código ${CODIGO_PAGO_GLOBAL}
                     </button>
                     <p style="font-size: 0.9em; margin-top: 10px;">Puedes pagar en cualquier banco con este código. (Ingresa GRACIAS para simular pago)</p>
                 </div>
             `;
        } else {
            // Opción 3: Logueado e inscrito, pago confirmado o gratuito -> Botón deshabilitado
            buttonHTML = `<button class="btn-primary inscrito" disabled>¡Inscrito! (Ingreso Confirmado)</button>`;
        }
    } else {
        // Opción 4: Logueado y no inscrito -> Botón de registro
        buttonHTML = `<button data-id="${evento.getId()}" class="btn-primary btn-registro-modal">Registrarse por ${evento.mostrarCosto()}</button>`;
    }

    modalContent.innerHTML = `
        <img src="${evento.getImagen()}" alt="Banner del evento" class="modal-img">
        <div class="modal-info">
            <h2>${evento.getNombre()}</h2>
            <p class="modal-fecha-ubicacion">🗓️ ${evento.getFecha()} | 📍 ${evento.getUbicacion()}</p>
            <p class="modal-descripcion">${evento.getDescripcion()}</p>
            <h4 class="modal-costo">Costo: ${evento.mostrarCosto()}</h4>
            <div class="modal-acciones">
                ${buttonHTML}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    
    // Adjuntar listeners dentro del modal
    document.querySelector('.btn-registro-modal')?.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        manejarRegistro(id);
        // Refresca el modal para mostrar el botón de pago si aplica
        setTimeout(() => mostrarDetallesModal(id), 100);
    });

    document.querySelector('.btn-pago-modal')?.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        const codigo = e.target.dataset.codigo;
        manejarPago(id, codigo);
    });
}

function cerrarDetallesModal() {
    const modal = document.getElementById('detallesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para renderizar las tarjetas de evento SIN el costo
function renderEventos() {
    const contenedorEventos = document.getElementById('eventos-contenedor');
    if (!contenedorEventos) return; 
    
    contenedorEventos.innerHTML = '';
    const eventos = app.getEventos();
    
    eventos.forEach(evento => {
        const eventoCard = document.createElement('div');
        eventoCard.classList.add('evento-card'); 
        eventoCard.dataset.id = evento.getId();
        eventoCard.addEventListener('click', () => mostrarDetallesModal(evento.getId()));
        
        // Se elimina la visualización del costo de la tarjeta principal (requisito del usuario)

        eventoCard.innerHTML = `
            <img src="${evento.getImagen()}" alt="Banner del evento">
            <div class="card-info">
                <h3>${evento.getNombre()}</h3>
                <p class="descripcion">${evento.getDescripcion().substring(0, 70)}...</p> 
                <div class="card-footer">
                    <span class="ver-detalles">Ver Detalles &rarr;</span> 
                </div>
            </div>
        `;
        contenedorEventos.appendChild(eventoCard);
    });
}

function manejarPago(eventoId, codigoEsperado) {
    const usuario = app.getUsuarioLogueado();
    if (!usuario) {
        alert("Debes iniciar sesión para realizar un pago.");
        return;
    }

    const codigoIngresado = prompt(`
        Ingresa el código del voucher para confirmar el pago del evento.
        Código de referencia: 	${codigoEsperado}
        
        Ingresa el código: GRACIAS
    `);

    if (codigoIngresado === null || codigoIngresado.trim() === "") {
        alert("Pago cancelado o código no ingresado.");
        return;
    }

    const codigoNormalizado = codigoIngresado.toUpperCase().trim();
    
    if (codigoNormalizado === codigoEsperado.toUpperCase() || codigoNormalizado === "GRACIAS") {
        // Marcar el pago en el objeto Usuario y persistir los datos
        usuario.marcarPago(eventoId); 
        app.guardarUsuarios(); 
        
        alert("✅ Pago confirmado con éxito! Tu inscripción ha sido validada.");
    } else {
        alert("❌ Código de voucher incorrecto. Por favor, verifica el código y vuelve a intentarlo.");
        return; 
    }
    
    // Refrescar las vistas después del pago exitoso
    if (document.getElementById('mis-eventos-contenedor')) { renderMisEventos(); }
    if (document.getElementById('eventos-contenedor')) { renderEventos(); }
    
    if(document.getElementById('detallesModal').style.display === 'flex') {
        mostrarDetallesModal(eventoId);
    }
}

function manejarRegistro(eventoId) {
    const evento = app.getEvento(eventoId);

    if (app.registrarUsuarioAEvento(eventoId)) {
        if (evento && evento.requierePago()) {
            alert("¡Registro exitoso! Tu cupo está reservado con pago pendiente. Revisa Mis Eventos para ver el código de pago (CC123456) e ingresar GRACIAS para simular el pago.");
        } else {
            alert("¡Registro exitoso! Revisa Mis eventos.");
        }
        if (document.getElementById('eventos-contenedor')) { renderEventos(); } 
        if (document.getElementById('mis-eventos-contenedor')) { renderMisEventos(); } 
    } else {
        alert("Ya estás inscrito o hubo un error.");
    }
}

function renderMisEventos() {
    const misEventosContenedor = document.getElementById('mis-eventos-contenedor');
    if (!misEventosContenedor) return; 

    misEventosContenedor.innerHTML = ''; 
    
    if (!app.getUsuarioLogueado()) {
        misEventosContenedor.innerHTML = '<p class="alerta-vacio">Debes iniciar sesión para ver tus eventos inscritos.</p>';
        return;
    }
    
    const eventosInscritos = app.obtenerEventosInscritos();

    if (eventosInscritos.length === 0) {
        misEventosContenedor.innerHTML = '<p class="alerta-vacio">Aún no te has inscrito a ningún evento. ¡Explora y regístrate!</p>';
        return;
    }

    eventosInscritos.forEach(evento => {
        const costo = evento.mostrarCosto();
        const inscripcion = app.getUsuarioLogueado().getInscripcionPorId(evento.getId());
        
        const CODIGO_PAGO = CODIGO_PAGO_GLOBAL;
        let estadoPagoHTML = '';
        let botonPagoHTML = '';
        
        const pagoConfirmado = inscripcion && inscripcion.esPagado();

        if (evento.requierePago() && !pagoConfirmado) {
            // PAGO PENDIENTE (Muestra el botón de pago)
            estadoPagoHTML = `<span class="estado-pago pendiente">PENDIENTE DE PAGO</span>`;
            botonPagoHTML = `<button class="btn-pago" data-id="${evento.getId()}" data-codigo="${CODIGO_PAGO}">Pagar Ahora (${CODIGO_PAGO})</button>`;
        } else {
            // GRATUITO O PAGO YA CONFIRMADO (Oculta el botón de pago)
            estadoPagoHTML = `<span class="estado-pago confirmado">Ingreso Confirmado</span>`;
        }

        const eventoFila = document.createElement('div');
        eventoFila.classList.add('evento-inscrito-fila');
        
        eventoFila.innerHTML = `
            <div class="info-evento">
                <h4>${evento.getNombre()}</h4>
                <p>Fecha: ${evento.getFecha()}</p>
            </div>
            <div class="detalle-costo">
                <span class="costo-estado">${costo}</span>
                ${estadoPagoHTML}
                ${botonPagoHTML}
            </div>
            <button 
                data-id="${evento.getId()}" 
                class="btn-cancelar"
            >
                Cancelar Inscripción
            </button>
        `;
        misEventosContenedor.appendChild(eventoFila);
    });

    document.querySelectorAll('.btn-cancelar').forEach(button => {
        button.addEventListener('click', (e) => {
            manejarCancelacion(parseInt(e.target.dataset.id));
        });
    });
    
    document.querySelectorAll('.detalle-costo .btn-pago').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventoId = parseInt(e.target.dataset.id); 
            const codigo = e.target.dataset.codigo;
            manejarPago(eventoId, codigo);
        });
    });
}

function manejarCancelacion(eventoId) {
    if (confirm("¿Estás seguro de que deseas cancelar tu inscripción a este evento?")) {
        if (app.cancelarInscripcionAEvento(eventoId)) {
            alert("Inscripción cancelada con éxito.");
            if (document.getElementById('mis-eventos-contenedor')) { renderMisEventos(); }
            if (document.getElementById('eventos-contenedor')) { renderEventos(); } 
            cerrarDetallesModal(); 
        } else {
            alert("Error al intentar cancelar la inscripción.");
        }
    }
}

function manejarLoginLogout() {
    const usuario = app.getUsuarioLogueado();
    if (usuario) {
        app.cerrarSesion();
        alert("Sesión cerrada.");
        window.location.href = "index.html"; 
    } else {
        mostrarLoginModal();
    }
}

function mostrarLoginModal() {
    cerrarDetallesModal(); 

    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        const errorMessage = document.getElementById('loginErrorMessage');
        if (errorMessage) errorMessage.textContent = '';
    }
}

function ocultarLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function manejarLoginSubmit(event) {
    event.preventDefault(); 
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMessage = document.getElementById('loginErrorMessage');

    if (!validarFormatoEmail(email)) {
        errorMessage.textContent = "Error: El formato del correo electrónico no es válido.";
        return;
    }

    if (app.validarLogin(email, password)) {
        // Redirigir y asegurar que la UI se actualice al cargar
        window.location.href = "index.html"; 
    } else {
        errorMessage.textContent = "Credenciales incorrectas o usuario no encontrado.";
    }
}

function mostrarModalExito() {
    const modalHTML = `
        <div id="registroExitoModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 10000; transition: opacity 0.3s ease; opacity: 0;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; border: 5px solid #00CC99; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; text-align: center;">
                <img src="https://i.imgur.com/yO88XJ0.png" alt="Registro Exitoso Icono" style="width: 70px; margin-bottom: 20px; ">
                <h3 style="color: #00CC99; margin-top: 0; font-size: 1.8em;">¡Registro Exitoso!</h3>
                <p style="margin-bottom: 30px; font-size: 1.1em; color: #333;">
                    Tu cuenta ha sido creada. Presiona **Cerrar** para ir al inicio de sesión.
                </p>
                <button id="closeAndRedirectBtn"
                        style="background-color: #7A008A; border: none; padding: 12px 25px; cursor: pointer; border-radius: 6px; color: white; font-weight: bold; font-size: 1em; transition: background-color 0.3s; width: 100%;">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('registroExitoModal');
    
    setTimeout(() => {
        if (modal) modal.style.opacity = '1';
    }, 10);

    const redirectBtn = document.getElementById('closeAndRedirectBtn');
    if (redirectBtn) {
        redirectBtn.addEventListener('click', () => {
            if (modal) modal.remove();
            window.location.href = "index.html"; 
        });
    }
}

function manejarRegistroSubmit(event) {
    event.preventDefault(); 

    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errorMessage = document.getElementById('registroErrorMessage');

    errorMessage.textContent = ''; 

    if (nombre.length < 2) {
        errorMessage.textContent = "El nombre debe tener al menos 2 caracteres.";
        return;
    }
    if (!validarFormatoEmail(email)) {
        errorMessage.textContent = "El formato del correo electrónico no es válido.";
        return;
    }
    if (password.length < 6) {
        errorMessage.textContent = "La contraseña debe tener al menos 6 caracteres.";
        return;
    }

    const resultado = app.registrarNuevoUsuario(nombre, email, password);
    
    if (resultado.success) {
        const registroForm = document.getElementById('registroForm');
        
        if (registroForm) {
            registroForm.style.display = 'none'; 
            
            const titulo = document.getElementById('registroTitulo');
            const descripcion = document.getElementById('registroDescripcion');
            if (titulo) titulo.style.display = 'none';
            if (descripcion) descripcion.style.display = 'none';
        }
        
        mostrarModalExito(); 
        
    } else {
        errorMessage.textContent = resultado.message;
    }
}

/**
 * [ACTUALIZADA] Actualiza la UI de la cabecera (Botón Login/Logout y Enlace Mis Eventos).
 */
function actualizarUI() {
    const usuario = app.getUsuarioLogueado();
    const loginBtn = document.getElementById('btn-login-logout');
    const misEventosLink = document.getElementById('navMisEventos'); // Nuevo

    // 1. Actualizar el botón Iniciar Sesión/Cerrar Sesión
    if (loginBtn) {
        loginBtn.textContent = usuario ? `Cerrar Sesión (${usuario.getNombre()})` : 'Iniciar Sesión';
        loginBtn.removeEventListener('click', manejarLoginLogout); 
        loginBtn.addEventListener('click', manejarLoginLogout);
    }
    
    // 2. Controlar la visibilidad del enlace "Mis Eventos"
    if (misEventosLink) {
        misEventosLink.style.display = usuario ? 'block' : 'none'; // Mostrar si hay usuario, ocultar si no
    }
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarUI(); // Usa la nueva función
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', manejarLoginSubmit);
    }
    const closeModalBtn = document.getElementById('closeLoginModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', ocultarLoginModal);
    }
    
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', manejarRegistroSubmit);
    }
    
    if (document.getElementById('eventos-contenedor')) { renderEventos(); }
    if (document.getElementById('mis-eventos-contenedor')) { renderMisEventos(); }
});