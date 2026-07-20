/**
 * IMIN editor bridge — se instala en refautomex.com (el sitio hijo).
 *
 * Recibe comandos por postMessage desde el editor IMIN (la app padre que
 * incrusta este sitio en un <iframe>) y aplica edicion en vivo:
 *   - modo "navigate": no hace nada, el sitio navega normal.
 *   - modo "text": bloquea la navegacion y hace contentEditable SOLO el texto
 *     que ya existe (no deja crear texto donde no lo hay); devuelve los cambios.
 *   - modo "media": bloquea la navegacion; al clickear una imagen (foreground o
 *     background) o un video avisa al editor con el "kind", que responde con
 *     "set-media" para reemplazar la fuente. Los videos solo aceptan mp4.
 *   - modo "style": bloquea la navegacion; al clickear un icono avisa
 *     "icon-selected" (el editor responde "set-icon" con el SVG nuevo) y al
 *     clickear un contenedor que YA tenga fondo propio avisa "color-selected"
 *     (el editor responde "set-color" con colorTarget "background"). No se
 *     pueden agregar fondos donde el diseño no los previo.
 *
 * El color del texto NO vive aqui sino en el modo "text": al seleccionar un
 * texto se manda su color actual y el editor puede responder "set-color" con
 * colorTarget "text". Asi cada modo tiene una sola responsabilidad.
 *
 * En todos los modos menos "navigate" el sitio queda "congelado": ademas de
 * bloquear los eventos que activan cosas, se anulan las APIs de navegacion
 * programatica (history, location, window.open, form.submit) para que ningun
 * router SPA ni script propio cambie el preview mientras se edita.
 *
 * El scroll nunca se bloquea (no interceptamos wheel/touch, y las teclas de
 * scroll siguen pasando). Solo se activa cuando la pagina esta dentro de un
 * iframe, asi que no afecta a visitantes.
 *
 * Seguridad: solo acepta mensajes de los origenes en ALLOWED_PARENT_ORIGINS.
 * Agrega ahi el origen donde despliegues el editor IMIN.
 */
(function () {
  "use strict";

  // Solo actuar cuando el sitio se ve dentro de un iframe (el editor).
  if (window.self === window.top) {
    return;
  }

  var ALLOWED_PARENT_ORIGINS = [
    // 1) Pruebas: el editor IMIN corriendo en tu localhost.
    "http://localhost:3000",
    // 2) Produccion: reemplaza por el dominio real donde despliegues el editor
    "https://appstracts.netlify.app",
  ];

  var HOVER_OUTLINE = "2px dashed #589bf9";
  var ACTIVE_OUTLINE = "2px solid #589bf9";

  var mode = "navigate";
  var parentOrigin = null;
  var currentEditable = null;
  var hoverEl = null;
  var sendTimer = null;

  function isAllowed(origin) {
    return ALLOWED_PARENT_ORIGINS.indexOf(origin) !== -1;
  }

  // Ruta CSS estable-ish para identificar el elemento entre padre e hijo.
  function cssPath(el) {
    if (!el || el.nodeType !== 1) {
      return "";
    }

    var path = [];

    while (el && el.nodeType === 1 && el !== document.body) {
      var selector = el.nodeName.toLowerCase();
      var parent = el.parentNode;

      if (parent && parent.children) {
        var sameTag = Array.prototype.filter.call(parent.children, function (child) {
          return child.nodeName === el.nodeName;
        });

        if (sameTag.length > 1) {
          selector += ":nth-of-type(" + (Array.prototype.indexOf.call(sameTag, el) + 1) + ")";
        }
      }

      path.unshift(selector);
      el = parent;
    }

    return path.join(" > ");
  }

  function post(message) {
    if (!parentOrigin) {
      return;
    }

    var payload = { source: "refautomex-bridge" };

    for (var key in message) {
      if (Object.prototype.hasOwnProperty.call(message, key)) {
        payload[key] = message[key];
      }
    }

    window.parent.postMessage(payload, parentOrigin);
  }

  // --- Deteccion de "donde SI se puede editar" -----------------------------

  // Verdadero si el elemento tiene texto propio (un nodo de texto directo con
  // contenido). Asi no convertimos en editable un contenedor vacio.
  function hasDirectText(el) {
    if (!el || el.nodeType !== 1) {
      return false;
    }

    var tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
      return false;
    }

    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim() !== "") {
        return true;
      }
    }

    return false;
  }

  // Sube desde el elemento clickeado hasta encontrar uno con texto propio.
  function findTextEl(el) {
    while (el && el !== document.body) {
      if (hasDirectText(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  // Verdadero si el elemento pinta una imagen de fondo (url(...)).
  function hasBackgroundImage(el) {
    if (!el || el.nodeType !== 1) {
      return false;
    }
    var bg = window.getComputedStyle(el).backgroundImage;
    return !!bg && bg !== "none" && bg.indexOf("url(") !== -1;
  }

  // Clasifica un elemento como medio reemplazable, o null si no lo es.
  function mediaKindOf(el) {
    if (!el || el.nodeType !== 1) {
      return null;
    }
    if (el.tagName === "IMG") {
      return "image";
    }
    if (el.tagName === "VIDEO") {
      return "video";
    }
    if (hasBackgroundImage(el)) {
      return "background";
    }
    return null;
  }

  // Sube desde el elemento clickeado hasta encontrar un medio reemplazable.
  function findMedia(el) {
    while (el && el !== document.body) {
      var kind = mediaKindOf(el);
      if (kind) {
        return { el: el, kind: kind };
      }
      el = el.parentElement;
    }
    return null;
  }

  function isRenderedEl(el) {
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) {
      return false;
    }
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  // Ultimo recurso: busca <img>/<video> cuya caja contenga el punto, aunque no
  // aparezcan en elementsFromPoint (por ejemplo con pointer-events:none).
  // Se queda con el mas pequeño, que es el mas especifico bajo el cursor.
  function smallestMediaContaining(x, y) {
    var candidates = document.querySelectorAll("img, video");
    var best = null;
    var bestArea = Infinity;

    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (!isRenderedEl(el)) {
        continue;
      }
      var rect = el.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        continue;
      }
      var area = rect.width * rect.height;
      if (area < bestArea) {
        bestArea = area;
        best = el;
      }
    }

    return best ? { el: best, kind: best.tagName === "VIDEO" ? "video" : "image" } : null;
  }

  function areaOf(el) {
    var rect = el.getBoundingClientRect();
    return rect.width * rect.height;
  }

  // Verdadero si "inner" cabe dentro de "outer": indica que inner es el
  // elemento mas especifico de los dos para el punto consultado.
  function isContainedBy(inner, outer) {
    var a = inner.getBoundingClientRect();
    var b = outer.getBoundingClientRect();
    return a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
  }

  // Medio alcanzable por hit-testing: el que el navegador reporta bajo el punto.
  function hitTestedMedia(x, y) {
    var stack =
      typeof document.elementsFromPoint === "function" ? document.elementsFromPoint(x, y) : [];

    // Los descendientes vienen antes que sus ancestros, asi que una imagen
    // concreta gana sobre el contenedor con background que la rodea.
    for (var i = 0; i < stack.length; i++) {
      if (stack[i] === document.body || stack[i] === document.documentElement) {
        break;
      }
      var kind = mediaKindOf(stack[i]);
      if (kind) {
        return { el: stack[i], kind: kind };
      }
    }

    // Un medio que envuelva al punto sin estar en el apilado directo.
    return stack.length > 0 ? findMedia(stack[0]) : null;
  }

  // Resuelve el medio bajo un punto atravesando las capas que lo tapen.
  //
  // Hay dos formas de que un medio quede fuera del alcance del hit-testing:
  // que algo transparente lo cubra, o que el propio medio (o un ancestro) tenga
  // pointer-events:none. El segundo caso es el de las tarjetas de producto
  // sobre el video: el navegador reporta el video de fondo y las imagenes de
  // encima resultan invisibles al puntero.
  //
  // Por eso no basta con quedarse con lo que reporta el navegador: si existe un
  // medio geometricamente contenido dentro de el, ese es el objetivo real.
  function mediaAtPoint(x, y) {
    var hit = hitTestedMedia(x, y);
    var geo = smallestMediaContaining(x, y);

    if (!hit) {
      return geo;
    }
    if (!geo || geo.el === hit.el) {
      return hit;
    }

    // Solo se prefiere el geometrico cuando es claramente mas especifico: cabe
    // completo dentro del otro y es mas chico. Asi una imagen de 176px sobre un
    // video de fondo gana, pero un medio del mismo tamaño no le roba la seleccion.
    if (isContainedBy(geo.el, hit.el) && areaOf(geo.el) < areaOf(hit.el)) {
      return geo;
    }

    return hit;
  }

  // Sube desde el elemento clickeado hasta encontrar un icono: un <svg> inline
  // o un <i>/<span> con clases tipicas de fuentes de iconos (Font Awesome, etc).
  function findIcon(el) {
    while (el && el !== document.body) {
      if (el.nodeType === 1) {
        var tag = el.tagName ? el.tagName.toLowerCase() : "";
        if (tag === "svg") {
          return el;
        }
        if (
          (tag === "i" || tag === "span") &&
          typeof el.className === "string" &&
          /(^|\s)(fa|fas|far|fab|fa-|bi|bi-|icon|material-icons|glyphicon|material-symbols)/i.test(
            el.className,
          )
        ) {
          return el;
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  // Verdadero si el elemento pinta su propio fondo. Heredar visualmente el del
  // padre no cuenta: solo un background-color opaco o una imagen de fondo.
  function hasOwnBackground(el) {
    var cs = window.getComputedStyle(el);

    if (cs.backgroundImage && cs.backgroundImage !== "none") {
      return true;
    }

    var bg = cs.backgroundColor;
    if (!bg || bg === "transparent") {
      return false;
    }

    // rgba(...) con alpha 0 es transparente aunque declare un color.
    var match = bg.match(/^rgba?\(([^)]+)\)/);
    if (match) {
      var parts = match[1].split(",");
      if (parts.length > 3 && parseFloat(parts[3]) === 0) {
        return false;
      }
    }

    return true;
  }

  // Sube hasta el contenedor mas cercano que YA tenga fondo propio.
  //
  // Se limita a esos a proposito: el editor no debe poder inventar fondos donde
  // el diseño no los previo. Se excluyen body y html porque pintarlos afectaria
  // la pagina entera en vez de un contenedor.
  function findBackgroundEl(el) {
    while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
      if (hasOwnBackground(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  // En modo "style" solo se editan dos cosas: iconos y fondos ya existentes.
  // El color del texto vive en el modo "text", junto al contenido.
  function styleTargetUnder(target) {
    var icon = findIcon(target);
    if (icon) {
      return { el: icon, kind: "icon" };
    }

    var background = findBackgroundEl(target);
    if (background) {
      return { el: background, kind: "background" };
    }

    return null;
  }

  // Devuelve el elemento editable bajo el cursor segun el modo, o null.
  // x/y son las coordenadas del puntero: en modo media hacen falta para poder
  // atravesar las capas que tapen la imagen.
  function editableUnder(target, x, y) {
    if (mode === "text") {
      return findTextEl(target);
    }
    if (mode === "media") {
      var media = mediaAtPoint(x, y);
      return media ? media.el : null;
    }
    if (mode === "style") {
      var styleTarget = styleTargetUnder(target);
      return styleTarget ? styleTarget.el : null;
    }
    return null;
  }

  // --- Resaltado por hover -------------------------------------------------

  function clearHover() {
    if (hoverEl && hoverEl !== currentEditable) {
      hoverEl.style.outline = "";
      hoverEl.style.outlineOffset = "";
    }
    hoverEl = null;
  }

  function setHover(el) {
    if (hoverEl === el) {
      return;
    }
    clearHover();
    if (el && el !== currentEditable) {
      el.style.outline = HOVER_OUTLINE;
      el.style.outlineOffset = "2px";
      hoverEl = el;
    }
  }

  // --- Edicion de texto ----------------------------------------------------

  function clearEditable() {
    if (currentEditable) {
      currentEditable.removeAttribute("contenteditable");
      currentEditable.style.outline = "";
      currentEditable.style.outlineOffset = "";
      currentEditable = null;
    }
  }

  function sendTextChange(el) {
    post({ type: "text-changed", selector: cssPath(el), value: el.textContent || "" });
  }

  // --- Bloqueo de navegacion ----------------------------------------------

  function isInsideEditable(node) {
    while (node) {
      if (node.nodeType === 1 && node.isContentEditable) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  // "Congelado" = cualquier modo de edicion. Ahi el sitio no debe navegar ni
  // reaccionar a su propio scripting: solo se edita.
  function isFrozen() {
    return mode !== "navigate";
  }

  // Eventos que disparan navegacion o logica de la pagina (routers SPA, <a>,
  // botones que navegan en mouseup/keydown, submits, drags...).
  // Deliberadamente NO tocamos wheel/touchmove/scroll: el scroll vive siempre.
  var GUARDED_EVENTS = [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "auxclick",
    "dblclick",
    "contextmenu",
    "submit",
    "reset",
    "change",
    "dragstart",
    "drop",
    "keydown",
    "keypress",
    "keyup",
  ];

  // Teclas que no bloqueamos aunque estemos congelados: son las que mueven el
  // scroll o la seleccion, y no activan nada.
  var SCROLL_KEYS = {
    ArrowUp: true,
    ArrowDown: true,
    ArrowLeft: true,
    ArrowRight: true,
    PageUp: true,
    PageDown: true,
    Home: true,
    End: true,
    Tab: true,
  };

  function guardNavigation(event) {
    if (!isFrozen()) {
      return;
    }

    // En modo texto dejamos pasar todo lo que ocurre dentro del campo activo
    // (posicionar cursor, seleccionar, escribir).
    if (mode === "text" && isInsideEditable(event.target)) {
      return;
    }

    // No matamos el scroll tactil: solo bloqueamos el puntero tipo mouse.
    if (
      (event.type === "pointerdown" || event.type === "pointerup") &&
      event.pointerType &&
      event.pointerType !== "mouse"
    ) {
      return;
    }

    // Fuera de un campo editable, el teclado no debe activar nada, pero si debe
    // poder mover el scroll.
    if (event.type.indexOf("key") === 0 && SCROLL_KEYS[event.key]) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  // Los registramos en window ademas de document para ganarle en fase de
  // captura a cualquier listener global que el sitio instale en document.
  GUARDED_EVENTS.forEach(function (type) {
    window.addEventListener(type, guardNavigation, true);
    document.addEventListener(type, guardNavigation, true);
  });

  // --- Congelado del scripting: navegacion programatica --------------------
  //
  // Bloquear eventos no basta: el sitio puede navegar desde un setTimeout, un
  // router.push, un location.href o un window.open. Envolvemos esas APIs para
  // que sean no-ops mientras estamos en un modo de edicion.

  function freezeMethod(owner, name) {
    if (!owner || typeof owner[name] !== "function") {
      return;
    }

    var original = owner[name];

    try {
      owner[name] = function () {
        if (isFrozen()) {
          return undefined;
        }
        return original.apply(this, arguments);
      };
    } catch (error) {
      /* propiedad no escribible en este navegador, se ignora */
    }
  }

  freezeMethod(window.history, "pushState");
  freezeMethod(window.history, "replaceState");
  freezeMethod(window.history, "back");
  freezeMethod(window.history, "forward");
  freezeMethod(window.history, "go");
  freezeMethod(window, "open");
  freezeMethod(window.Location && window.Location.prototype, "assign");
  freezeMethod(window.Location && window.Location.prototype, "replace");
  freezeMethod(window.Location && window.Location.prototype, "reload");
  freezeMethod(window.HTMLFormElement && window.HTMLFormElement.prototype, "submit");
  freezeMethod(window.HTMLFormElement && window.HTMLFormElement.prototype, "requestSubmit");

  // Red de seguridad final: la Navigation API intercepta TODA navegacion del
  // documento (incluido `location.href = ...`, que no se puede envolver).
  // Solo existe en Chromium; en el resto quedan las capas de arriba.
  if (window.navigation && typeof window.navigation.addEventListener === "function") {
    window.navigation.addEventListener("navigate", function (event) {
      if (isFrozen() && event.cancelable) {
        event.preventDefault();
      }
    });
  }

  // --- Click: selecciona el elemento a editar ------------------------------

  function onClickCapture(event) {
    if (mode === "navigate") {
      return;
    }

    var target = event.target;

    if (mode === "text") {
      // Permite mover el cursor / escribir dentro del campo ya activo.
      if (isInsideEditable(target)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      var textEl = findTextEl(target);

      // Sin texto propio => no se puede editar aqui (no creamos texto nuevo).
      if (!textEl) {
        clearEditable();
        return;
      }

      if (textEl === currentEditable) {
        return;
      }

      clearEditable();
      setHover(null);
      textEl.setAttribute("contenteditable", "true");
      textEl.style.outline = ACTIVE_OUTLINE;
      textEl.style.outlineOffset = "2px";
      currentEditable = textEl;
      textEl.focus();
      // Se manda el color actual para que el editor abra su control de color
      // del texto ya sincronizado con lo que se ve.
      post({
        type: "text-selected",
        selector: cssPath(textEl),
        value: textEl.textContent || "",
        color: window.getComputedStyle(textEl).color,
      });
      return;
    }

    if (mode === "media") {
      event.preventDefault();
      event.stopImmediatePropagation();

      var media = mediaAtPoint(event.clientX, event.clientY);

      // Sin medio reemplazable => no se puede agregar de mas.
      if (!media) {
        return;
      }

      post({ type: "media-selected", selector: cssPath(media.el), kind: media.kind });
      return;
    }

    if (mode === "style") {
      event.preventDefault();
      event.stopImmediatePropagation();

      var styleTarget = styleTargetUnder(target);
      if (!styleTarget) {
        return;
      }

      if (styleTarget.kind === "icon") {
        post({ type: "icon-selected", selector: cssPath(styleTarget.el) });
      } else {
        post({ type: "color-selected", selector: cssPath(styleTarget.el) });
      }
      return;
    }
  }

  // Captura en fase de captura para ganarle al router SPA y a los <a>.
  document.addEventListener("click", onClickCapture, true);

  // Hover: muestra donde SI se puede editar y marca "no permitido" donde no.
  //
  // Se limita a un calculo por frame: resolver el medio bajo el cursor puede
  // implicar medir todas las imagenes de la pagina, y hacerlo en cada mousemove
  // provocaria relayouts constantes.
  var hoverFrame = null;
  var hoverEvent = null;

  function updateHover() {
    hoverFrame = null;

    if (!hoverEvent) {
      return;
    }

    var editable = editableUnder(hoverEvent.target, hoverEvent.x, hoverEvent.y);
    setHover(editable);

    document.body.style.cursor = editable
      ? mode === "media"
        ? "copy"
        : mode === "style"
          ? "pointer"
          : "text"
      : "not-allowed";
  }

  document.addEventListener(
    "mousemove",
    function (event) {
      if (mode === "navigate") {
        hoverEvent = null;
        setHover(null);
        return;
      }

      // Se guardan los datos, no el evento, que deja de ser valido al salir.
      hoverEvent = { target: event.target, x: event.clientX, y: event.clientY };

      if (hoverFrame === null) {
        hoverFrame = window.requestAnimationFrame(updateHover);
      }
    },
    true,
  );

  document.addEventListener(
    "input",
    function (event) {
      if (mode !== "text" || !currentEditable || event.target !== currentEditable) {
        return;
      }

      if (sendTimer) {
        clearTimeout(sendTimer);
      }

      var el = currentEditable;
      sendTimer = setTimeout(function () {
        sendTextChange(el);
      }, 300);
    },
    true,
  );

  document.addEventListener(
    "blur",
    function (event) {
      if (currentEditable && event.target === currentEditable) {
        sendTextChange(currentEditable);
        clearEditable();
      }
    },
    true,
  );

  // --- Reemplazo de medios -------------------------------------------------

  function applyMedia(selector, kind, src) {
    var el = document.querySelector(selector);
    if (!el) {
      return;
    }

    if (kind === "image" && el.tagName === "IMG") {
      el.removeAttribute("srcset");
      el.removeAttribute("sizes");

      // Dentro de un <picture>, los <source> mandan sobre el src del <img>:
      // si no se quitan, el reemplazo no se ve. Es el caso de next/image.
      var parent = el.parentElement;
      if (parent && parent.tagName === "PICTURE") {
        var sources = parent.querySelectorAll("source");
        for (var i = 0; i < sources.length; i++) {
          sources[i].parentNode.removeChild(sources[i]);
        }
      }

      el.src = src;
      return;
    }

    if (kind === "background") {
      // JSON.stringify envuelve en comillas y escapa el data URL de forma segura.
      el.style.backgroundImage = "url(" + JSON.stringify(src) + ")";
      return;
    }

    if (kind === "video" && el.tagName === "VIDEO") {
      // Quita los <source> hijos para que no ganen sobre el nuevo src.
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      el.removeAttribute("srcset");
      el.src = src;
      el.load();
      return;
    }
  }

  // --- Estilo: color e iconos ---------------------------------------------

  // El editor solo ofrece izquierda y derecha.
  function gradientCss(direction, from, to) {
    return "linear-gradient(" + (direction === "left" ? "to left" : "to right") + ", " + from + ", " + to + ")";
  }

  // Quita los restos de un degradado de texto para poder volver a color solido.
  function clearTextGradient(el) {
    el.style.backgroundImage = "";
    el.style.removeProperty("-webkit-background-clip");
    el.style.removeProperty("background-clip");
    el.style.removeProperty("-webkit-text-fill-color");
  }

  // options: { colorTarget, fill, color, colorEnd, direction }
  //   colorTarget: "text" | "background"
  //   fill:        "solid" | "gradient"  (ausente = solido, por compatibilidad)
  function applyColor(selector, options) {
    var el = document.querySelector(selector);
    if (!el) {
      return;
    }

    var isGradient = options.fill === "gradient" && !!options.colorEnd;

    if (options.colorTarget === "background") {
      if (isGradient) {
        // backgroundColor se limpia para que no asome bajo el degradado.
        el.style.backgroundColor = "";
        el.style.backgroundImage = gradientCss(options.direction, options.color, options.colorEnd);
      } else {
        el.style.backgroundImage = "";
        el.style.backgroundColor = options.color;
      }
      return;
    }

    if (isGradient) {
      // El degradado se recorta a la forma de las letras y el relleno del texto
      // se vuelve transparente para dejarlo ver.
      el.style.color = "";
      el.style.backgroundImage = gradientCss(options.direction, options.color, options.colorEnd);
      el.style.setProperty("-webkit-background-clip", "text");
      el.style.setProperty("background-clip", "text");
      el.style.setProperty("-webkit-text-fill-color", "transparent");
      return;
    }

    clearTextGradient(el);
    el.style.color = options.color;
  }

  function applyIcon(selector, svgMarkup) {
    var oldEl = document.querySelector(selector);
    if (!oldEl || !oldEl.parentNode) {
      return;
    }

    var tmp = document.createElement("div");
    tmp.innerHTML = svgMarkup;
    var newEl = tmp.firstElementChild;
    if (!newEl) {
      return;
    }

    // Conserva el tamano y color del icono original para que encaje visualmente.
    var cs = window.getComputedStyle(oldEl);
    newEl.style.width = cs.width;
    newEl.style.height = cs.height;
    newEl.style.color = cs.color;
    newEl.style.verticalAlign = cs.verticalAlign;

    oldEl.parentNode.replaceChild(newEl, oldEl);
  }

  window.addEventListener("message", function (event) {
    if (!isAllowed(event.origin)) {
      return;
    }

    var data = event.data;

    if (!data || data.source !== "imin-editor") {
      return;
    }

    parentOrigin = event.origin;

    if (data.type === "set-mode") {
      mode = data.mode || "navigate";

      if (mode !== "text") {
        clearEditable();
      }

      setHover(null);
      document.body.style.cursor =
        mode === "media"
          ? "copy"
          : mode === "text"
            ? "text"
            : mode === "style"
              ? "pointer"
              : "";
      return;
    }

    if (data.type === "set-media" && data.selector && data.kind && data.src) {
      applyMedia(data.selector, data.kind, data.src);
      return;
    }

    if (data.type === "set-color" && data.selector && data.color) {
      applyColor(data.selector, {
        colorTarget: data.colorTarget,
        fill: data.fill,
        color: data.color,
        colorEnd: data.colorEnd,
        direction: data.direction,
      });
      return;
    }

    if (data.type === "set-icon" && data.selector && data.svg) {
      applyIcon(data.selector, data.svg);
      return;
    }
  });

  // Anuncia disponibilidad a cualquiera de los origenes permitidos.
  ALLOWED_PARENT_ORIGINS.forEach(function (origin) {
    try {
      window.parent.postMessage({ source: "refautomex-bridge", type: "ready" }, origin);
    } catch (error) {
      /* origen no disponible, se ignora */
    }
  });
})();
