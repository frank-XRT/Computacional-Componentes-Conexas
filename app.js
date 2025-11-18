let analizado = false;

const canvas = document.getElementById('grafoCanvas');
const ctx = canvas.getContext('2d');
const inputN = document.getElementById('inputN');
const btnGen = document.getElementById('btnGen');
const btnRegresar = document.getElementById('btnRegresar');

const btnConectar = document.getElementById('btnConectar');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnVer = document.getElementById('btnVer');
const logArea = document.getElementById('logArea');



btnVer.style.display = 'none';
btnRegresar.style.display = 'none';



let n = 0;
let nodos = [];
let aristas = [];
let matriz = [];
let nodoSeleccionado = null;
let componentes = [];
let ultimaMatrizRandom = null;
const radioNodo = 22;


const palette = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B500", "#6C5B7B"];

// helpers
function log(s, estilo = null) {
  if (estilo === "titulo") {
    logArea.textContent += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n    " + s + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  } else if (estilo === "subtitulo") {
    logArea.textContent += "\n" + s + "\n" + "-".repeat(50) + "\n";
  } else {
    logArea.textContent += s + "\n";
  }
  logArea.scrollTop = logArea.scrollHeight;
}
function clearLog() { logArea.textContent = ""; }

function crearMatriz(sz) { matriz = Array.from({ length: sz }, () => Array(sz).fill(0)); }

function generarNodos() {

  const valor = parseInt(inputN.value);

  if (isNaN(valor) || valor < 4|| valor > 12) {
    clearLog();
    log("❌ Error: Debe ingresar un número entre 4 y 12.");
    return;
  }

  n = valor;

  nodos = [];
  aristas = [];
  crearMatriz(n);
  const cx = canvas.width / 2, cy = canvas.height / 2, radio = Math.min(canvas.width, canvas.height) * 0.35;
  for (let i = 0; i < n; i++) {
    const ang = 2 * Math.PI * i / n - Math.PI / 2;
    const x = cx + radio * Math.cos(ang);
    const y = cy + radio * Math.sin(ang);
    nodos.push({ x, y });
  }
  nodoSeleccionado = null;
  componentes = [];
  draw();
  clearLog();
  log(`✓ ${n} nodos generados\n→ Seleccione modo de conexión y presione 'Conectar'`);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // aristas
  // === ARISTAS CON COLOR SEGÚN COMPONENTE ===
  for (let compIndex = 0; compIndex < componentes.length; compIndex++) {
    const comp = componentes[compIndex];

    // Solo coloreamos componentes de tamaño ≥ 2
    if (comp.length >= 2) {
      const color = palette[compIndex % palette.length];

      // Dibujar SOLO las aristas internas de la componente
      for (const [u, v] of aristas) {
        if (comp.includes(u) && comp.includes(v)) {
          drawArrow(nodos[u], nodos[v], color);
        }
      }
    }
  }

  // Aristas NO pertenecientes a componentes grandes = gris
  for (const [u, v] of aristas) {
    if (!componentes.some(c => c.length >= 2 && c.includes(u) && c.includes(v))) {
      drawArrow(nodos[u], nodos[v], '#999');
    }
  }


  for (let i = 0; i < n; i++) {
    const col = (componentes.length ? (componentes.flat().includes(i) ? getComponentColor(i) : '#43A047') : (nodoSeleccionado === i ? '#EF6C00' : '#43A047'));
    drawNode(nodos[i], i, col);
  }

}

function drawNode(p, idx, color) {
  ctx.beginPath(); ctx.fillStyle = color; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.arc(p.x, p.y, radioNodo, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // texto (ajusta color según luminancia)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(idx), p.x, p.y);
}

function drawArrow(a, b, color) {
  const dx = b.x - a.x, dy = b.y - a.y; let dist = Math.hypot(dx, dy); if (dist < 1) return;
  const ux = dx / dist, uy = dy / dist;
  const offset = radioNodo + 6;
  const x1 = a.x + ux * offset, y1 = a.y + uy * offset;
  const x2 = b.x - ux * offset, y2 = b.y - uy * offset;
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  // arrow head
  const ah_len = 12, ah_w = 6; const bx = x2 - ux * ah_len, by = y2 - uy * ah_len; const nx = -uy, ny = ux;
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(bx + nx * ah_w, by + ny * ah_w); ctx.lineTo(bx - nx * ah_w, by - ny * ah_w); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

function canvasToNodeIndex(x, y) {
  for (let i = 0; i < n; i++) {
    const dx = x - nodos[i].x, dy = y - nodos[i].y; if (Math.hypot(dx, dy) <= radioNodo + 8) return i;
  }
  return null;
}

canvas.addEventListener('pointerdown', (ev) => {
  if (!nodos.length) return;
  const rect = canvas.getBoundingClientRect(); const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
  const modo = document.querySelector('input[name="modo"]:checked').value;
  if (modo !== 'manual') return;
  if (componentes.length) return; // no permitir cuando ya analizado
  const idx = canvasToNodeIndex(x, y);
  if (idx === null) return;
  if (nodoSeleccionado === null) { nodoSeleccionado = idx; }
  else { if (nodoSeleccionado !== idx) { const a = [nodoSeleccionado, idx]; if (!aristas.some(e => e[0] === a[0] && e[1] === a[1])) { aristas.push(a); matriz[a[0]][a[1]] = 1 } } nodoSeleccionado = null; }
  draw();
});

function randomConnect() {
  if (n <= 0) return;

  let esIgual = true;
  let intentos = 0;

  while (esIgual && intentos < 10) {  // máximo 10 intentos para evitar bucles infinitos
    intentos++;

    aristas = [];
    crearMatriz(n);

    const maxAr = n * (n - 1);
    const num = Math.floor(Math.random() * (maxAr - (n - 1) + 1)) + (n - 1);

    let attempts = 0;
    while (aristas.length < num && attempts < num * 4) {
      const i = Math.floor(Math.random() * n);
      const j = Math.floor(Math.random() * n);
      if (i !== j) {
        if (!aristas.some(e => e[0] === i && e[1] === j)) {
          aristas.push([i, j]);
          matriz[i][j] = 1;
        }
      }
      attempts++;
    }

    // copiamos matriz actual
    const nueva = matriz.map(fila => fila.slice());

    // comparamos con la anterior
    if (!ultimaMatrizRandom ||
      JSON.stringify(nueva) !== JSON.stringify(ultimaMatrizRandom)) {
      esIgual = false;
      ultimaMatrizRandom = nueva;
    }
  }

  draw();
  log(`✓ ${aristas.length} conexiones dirigidas generadas aleatoriamente`);
}


function limpiar() {
  aristas = [];
  crearMatriz(n);
  componentes = [];
  nodoSeleccionado = null;
  draw();
  clearLog();
  log('Conexiones limpiadas');

  // ocultar botones de ver/regresar
  btnVer.style.display = 'none';
  btnRegresar.style.display = 'none';
}
function getComponentColor(nodeIndex) {
  for (let i = 0; i < componentes.length; i++) if (componentes[i].includes(nodeIndex)) return palette[i % palette.length];
  return '#43A047';
}


function logMatrix(mat, titulo = null) {

  if (titulo) log(" " + titulo);

  const n = mat.length;

  // Tamaño fijo de celda
  const cell = 4; // 4 espacios

  // Header
  let header = "    ";
  for (let i = 0; i < n; i++) header += String(i).padStart(cell);
  log(header);

  log("    " + "-".repeat(n * cell));

  // Filas
  for (let i = 0; i < n; i++) {
    let fila = String(i).padStart(3) + " |";
    for (let j = 0; j < n; j++) {
      fila += String(mat[i][j]).padStart(cell);
    }
    log(fila);
  }

  log("\n");
}

// Centra un texto dentro de un ancho fijo (para alinear columnas)
function centerText(text, width) {
  text = String(text);
  if (text.length >= width) return text.slice(0, width);
  const spaces = width - text.length;
  const left = Math.floor(spaces / 2);
  const right = spaces - left;
  return " ".repeat(left) + text + " ".repeat(right);
}


// Centra un texto dentro de un ancho fijo (para alinear columnas)
function centerText(text, width) {
  text = String(text);
  if (text.length >= width) return text.slice(0, width);
  const spaces = width - text.length;
  const left = Math.floor(spaces / 2);
  const right = spaces - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

function logMatrixResaltada(
  mat,
  bloques,
  titulo = "Matriz con componentes resaltadas",
  indices_nodos = null
) {
  log(" " + titulo);

  const n = mat.length;
  const cell = 5; // ancho fijo de cada columna

  // Si no se pasan índices, usamos 0..n-1
  if (!indices_nodos) {
    indices_nodos = Array.from({ length: n }, (_, i) => i);
  }

  function isInBlock(i, j) {
    return bloques.some(([r1, r2, c1, c2]) =>
      i >= r1 && i <= r2 && j >= c1 && j <= c2
    );
  }

  // ENCABEZADO
  let header = "    ";
  for (let j = 0; j < n; j++) {
    header += centerText(indices_nodos[j], cell);
  }
  log(header);

  // SEPARADOR
  log("    " + "-".repeat(n * cell));

  // FILAS
  for (let i = 0; i < n; i++) {
    let fila = String(indices_nodos[i]).padStart(3) + " |";

    for (let j = 0; j < n; j++) {
      const val = mat[i][j];
      let texto;
      if (val === 1 && isInBlock(i, j)) {
        texto = "[1]";
      } else {
        texto = String(val);
      }
      fila += centerText(texto, cell);
    }
    log(fila);
  }

  log("\n");
}



function analizar() {

  function filaToString(idx, row) {
    // Devuelve algo como: "Fila 2:  0  1  0  1  0 ..."
    return "Fila " + idx + ": " + row.map(v => String(v)).join("  ");
  }

  function filaToStringBrackets(idx, row) {
    return "Fila " + idx + ": [ " + row.map(v => String(v)).join("  ") + " ]";
  }


  if (!nodos.length) { log('Primero genera los nodos.'); return; }
  clearLog();
  log('PROCESO DE IDENTIFICACIÓN DE COMPONENTES CONEXAS', 'titulo');

  
  log('PASO 1: Llenar diagonal de unos', 'subtitulo');
  const matriz_p1 = matriz.map(r => r.slice());
  for (let i = 0; i < n; i++) matriz_p1[i][i] = 1;
  log('Matriz (con diagonal de 1s):');
  logMatrix(matriz_p1);

  log(""); // salto final opcional


  // Construir matriz de caminos (simulación compacta)
  log('\nPASO 2: MATRIZ DE CAMINOS\nSi la fila i tiene un 1 en la columna j, copiar la fila j a la fila i\n');
  let matriz_p2 = matriz.map(r => r.slice());
  for (let i = 0; i < n; i++) matriz_p2[i][i] = 1;
  // salto de línea

  // Propagar: versión iterativa por filas (como tu Python)
  for (let i = 0; i < n; i++) {
    log(`Procesando fila ${i}\n${"-".repeat(50)}\n`);
    let hubo_cambios = true;
    let iter = 1;

    while (hubo_cambios) {
      hubo_cambios = false;
      const fila_antes = matriz_p2[i].slice();
      const fila_nueva = matriz_p2[i].slice();

      log(`  Iteración ${iter}:\n\n    Estado inicial: \n\n    ${filaToStringBrackets(i, fila_antes)}\n`);

      // Recorremos todas las columnas j de la fila i
      for (let j = 0; j < n; j++) {
        if (fila_antes[j] === 1 && i !== j) {
          let aporta = false;

          // Verificamos si la fila j tiene algún 1 que aún no esté en la fila i
          for (let k = 0; k < n; k++) {
            if (matriz_p2[j][k] === 1 && fila_nueva[k] === 0) {
              aporta = true;
              break;
            }
          }

          if (aporta) {
            log(`    Columna ${j} = 1 → Copiando fila ${j} a fila ${i}\n`);
            log(`    ${filaToStringBrackets(j, matriz_p2[j])}\n`);

            // Copiamos los 1 de la fila j a la fila i
            for (let k = 0; k < n; k++) {
              if (matriz_p2[j][k] === 1) {
                fila_nueva[k] = 1;
              }
            }

            log(`    Fila ${i} actualizada: [ ${fila_nueva.join("  ")} ]\n`);
          }
        }
      }

      // Comprobamos si hubo cambios reales en la fila
      if (JSON.stringify(fila_nueva) !== JSON.stringify(fila_antes)) {
        hubo_cambios = true;
        matriz_p2[i] = fila_nueva;
      }

      iter++;
    }

    // mostrar matriz parcial
    log(`\n  Matriz después de procesar la fila ${i}:\n`);
    logMatrix(matriz_p2);
    log(""); // Espacio adicional para separar filas
  }

  // Paso 3: ORDENAR FILAS Y COLUMNAS POR número DE UNOS
  log('PASO 3: ORDENAR FILAS Y COLUMNAS por numero de UNOS');

  const conteo_unos = [];
  for (let i = 0; i < n; i++) {
    const fila = matriz_p2[i];
    const firma = [];
    for (let j = 0; j < n; j++) {
      if (fila[j] === 1) firma.push(j);
    }
    conteo_unos.push({
      nodo: i,                // índice original del nodo
      cnt: firma.length,      // cantidad de 1's
      firma: firma,           // tupla de columnas con 1
      original: i             // índice original para desempate
    });
  }

  // Ordenar como en Python: (-cnt, firma lexicográfica, índice original)
  conteo_unos.sort((a, b) => {
    // 1) más unos primero
    if (b.cnt !== a.cnt) return b.cnt - a.cnt;

    // 2) firma lexicográfica
    const len = Math.min(a.firma.length, b.firma.length);
    for (let k = 0; k < len; k++) {
      if (a.firma[k] !== b.firma[k]) return a.firma[k] - b.firma[k];
    }
    if (a.firma.length !== b.firma.length) {
      return a.firma.length - b.firma.length;
    }

    // 3) índice original
    return a.original - b.original;
  });

  const orden_nodos = conteo_unos.map(x => x.nodo);

  // Reordenar filas
  const filas_ordenadas = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      filas_ordenadas[i][j] = matriz_p2[orden_nodos[i]][j];
    }
  }
  log('\nMatriz despues de ordenar FILAS:');
  logMatrix(filas_ordenadas);

  // Reordenar columnas
  const matriz_p3 = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matriz_p3[i][j] = filas_ordenadas[i][orden_nodos[j]];
    }
  }
  log('Matriz despues de ordenar FILAS Y COLUMNAS:');
  logMatrix(matriz_p3);

  // Paso 4: IDENTIFICAR COMPONENTES CONEXAS (misma lógica que en Python)
  log('PASO 4: IDENTIFICAR COMPONENTES CONEXAS');

  componentes = [];
  const visitado = Array(n).fill(false);
  let idx = 0;
  const bloques = [];

  while (idx < n) {
    if (!visitado[idx]) {
      let tmax = 1;
      for (let t = 1; t <= n - idx; t++) {
        let es_val = true;
        for (let f = idx; f < idx + t; f++) {
          for (let c = idx; c < idx + t; c++) {
            if (matriz_p3[f][c] !== 1) {
              es_val = false;
              break;
            }
          }
          if (!es_val) break;
        }
        if (es_val) {
          tmax = t;
        } else {
          break;
        }
      }

      const comp = [];
      for (let k = idx; k < idx + tmax; k++) {
        comp.push(orden_nodos[k]);   // usamos índices originales
      }
      comp.sort((a, b) => a - b);
      componentes.push(comp);

      bloques.push([idx, idx + tmax - 1, idx, idx + tmax - 1]);

      for (let k = idx; k < idx + tmax; k++) {
        visitado[k] = true;
      }
      idx += tmax;
    } else {
      idx++;
    }
  }

  // Mostrar la matriz con [1] resaltados usando los índices originales
  logMatrixResaltada(
    matriz_p3,
    bloques,
    "Matriz con componentes resaltadas [1]",
    orden_nodos
  );

  log(`Número total de componentes: ${componentes.length}`);
  componentes.forEach((c, i) => {
    log(`Componente ${i + 1}: [${c.join(',')}] (tamaño ${c.length})`);
  });

  // recolor y redraw
  draw();
  analizado = true;
  btnVer.style.display = "inline-block";

}

// Mostrar botón "Ver Grafos Conexos" solo cuando termine el análisis
btnVer.style.display = 'inline-block';
btnRegresar.style.display = 'none';

btnGen.addEventListener('click', () => { generarNodos(); });
btnLimpiar.addEventListener('click', () => { limpiar(); });
btnConectar.addEventListener('click', () => {
  const modoSel = document.querySelector('input[name="modo"]:checked').value;
  if (modoSel === 'aleatorio') randomConnect();
  analizar();
});
btnVer.addEventListener('click', () => {
  if (!componentes.length) { log('Primero analiza las componentes.'); return; }

  // Ocultar botón Ver y mostrar Regresar
  btnVer.style.display = 'none';
  btnRegresar.style.display = 'inline-block';

  // dibujar subgrafos en mosaico
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cols = Math.min(componentes.length, 3);
  const rows = Math.ceil(componentes.length / cols);
  const w = canvas.width / cols, h = canvas.height / rows;
  for (let idx = 0; idx < componentes.length; idx++) {
    const comp = componentes[idx];
    const col = idx % cols, row = Math.floor(idx / cols);
    const cx = col * w + w / 2, cy = row * h + h / 2; const r = Math.min(w, h) * 0.35;
    const posmap = {};
    for (let i = 0; i < comp.length; i++) {
      const ang = 2 * Math.PI * i / comp.length - Math.PI / 2; const x = cx + r * Math.cos(ang); const y = cy + r * Math.sin(ang);
      posmap[comp[i]] = { x, y };
    }
    for (const [u, v] of aristas) { if (comp.includes(u) && comp.includes(v)) drawArrow(posmap[u], posmap[v], palette[idx % palette.length]); }
    for (const nodo of comp) { drawNode(posmap[nodo], nodo, palette[idx % palette.length]); }
    ctx.fillStyle = palette[idx % palette.length]; ctx.font = '700 18px Poppins'; ctx.textAlign = 'center'; ctx.fillText(`Componente ${idx + 1}`, cx, row * h + 25);
  }
});

btnRegresar.addEventListener('click', () => {
  // Ocultar regresar, mostrar ver
  btnRegresar.style.display = 'none';
  btnVer.style.display = 'inline-block';

  // Restaurar el grafo original (redibujar con el estado actual de nodos y aristas)
  draw();
});


const portada = document.getElementById("portada");
const btnPortada = document.getElementById("btnPortada");
const btnEntrar = document.getElementById("btnEntrar");

btnEntrar.addEventListener("click", () => {
  portada.style.opacity = "0";
  setTimeout(() => { portada.style.display = "none"; }, 500);

  // mostrar botón portada ahora que ya estás dentro
  btnPortada.style.display = "block";
});

// Cuando hace clic en "Portada", volver a la portada
btnPortada.addEventListener("click", () => {
  // Mostrar portada
  portada.style.display = "flex";
  portada.style.opacity = "1";

  // Ocultar mientras estás en portada
  btnPortada.style.display = "none";

  // Opcional: limpiar log
  clearLog();
});


btnEntrar.addEventListener("click", () => {
  portada.style.opacity = "0";
  setTimeout(() => { portada.style.display = "none"; }, 500);
});

// === REGRESAR A LA PORTADA ===

// Cuando el usuario entra a la app, el botón "Portada" aparece
btnEntrar.addEventListener("click", () => {
  portada.style.opacity = "0";
  setTimeout(() => { portada.style.display = "none"; }, 500);

  // mostramos el botón Portada en la aplicación
  btnPortada.style.display = "inline-block";

  // si ya se analizó antes, restauramos el botón Ver grafos
  if (analizado) {
    btnVer.style.display = "inline-block";
  }
});

// Cuando presiona el botón "Portada"
btnPortada.addEventListener("click", () => {
  // mostrar portada
  portada.style.display = "flex";
  portada.style.opacity = "1";

  // ocultamos el botón mientras estamos en portada
  btnPortada.style.display = "none";
  btnRegresar.style.display = "none";
});



portada.style.display = "flex";
portada.style.opacity = "1";

window.addEventListener("load", () => {
  document.documentElement.classList.remove("preload");
  document.body.classList.remove("preload");
});

// ===============================
// MODO CLARO / OSCURO
// ===============================
(function () {
  const chkTema = document.getElementById("chkTema");
  if (!chkTema) return;  // si no existe, no hacemos nada

  // Restaurar tema guardado
  const saved = localStorage.getItem("tema");
  if (saved === "dark") {
    document.body.classList.add("dark");
    chkTema.checked = true;
  }

  chkTema.addEventListener("change", (e) => {
    const isDark = e.target.checked;
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("tema", isDark ? "dark" : "light");
  });
})();



// ===============================
// PORTADA: entrar / volver
// ===============================
(function () {

  // === PORTADA / LANDING ===
  const portada = document.getElementById("portada");
  const btnPortada = document.getElementById("btnPortada");
  const btnEntrar = document.getElementById("btnEntrar");

  // Entrar a la app
  if (btnEntrar && portada && btnPortada) {
    btnEntrar.addEventListener("click", () => {
      portada.style.opacity = "0";
      setTimeout(() => {
        portada.style.display = "none";
      }, 600);

      // mostramos botón Portada dentro de la app
      btnPortada.style.display = "inline-block";

      // si ya se analizó antes, volvemos a mostrar "Ver grafos"
      if (analizado) {
        btnVer.style.display = "inline-block";
      }
    });

    // Volver a portada
    btnPortada.addEventListener("click", () => {
      portada.style.display = "flex";
      portada.style.opacity = "1";

      // ocultamos el botón mientras estamos en portada
      btnPortada.style.display = "none";
      btnRegresar.style.display = "none";
    });
  }

  // Mostrar portada al cargar
  if (portada) {
    portada.style.display = "flex";
    portada.style.opacity = "1";
  }

})();

// === MODO OSCURO / CLARO ===
const chkTema = document.getElementById("chkTema");

// Cargar preferencia guardada
const temaGuardado = localStorage.getItem("tema-grafo");
if (temaGuardado === "dark") {
  document.body.classList.add("dark");
  if (chkTema) chkTema.checked = true;
}

if (chkTema) {
  chkTema.addEventListener("change", () => {
    const darkOn = chkTema.checked;
    document.body.classList.toggle("dark", darkOn);
    localStorage.setItem("tema-grafo", darkOn ? "dark" : "light");
  });
}
