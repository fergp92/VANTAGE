# Design: ANIMA — Animatrónico doméstico conversacional con capa de protección y realidad expandida

**Fecha:** 2026-08-23
**Estado:** Propuesta (pendiente de Gate G0 — Kickoff)
**Ceremonia sugerida:** Full (escala a Enterprise si se comercializa)
**Codename:** ANIMA *(placeholder — el nombre es parte del diseño de personaje, ver §7)*

---

## Resumen

Construir un **personaje animatrónico doméstico** al que se le habla en lenguaje natural, que
vive en una casa, reconoce a quien vive en ella, controla la domótica, **vigila el hogar** y
usa **proyección, luz y audio espacial** como capa de realidad expandida.

La tesis de diseño está tomada directamente de Walt Disney Imagineering:

> **La tecnología está al servicio del personaje. Si el usuario nota la tecnología, el diseño falló.**

De ahí se derivan tres decisiones estructurales que condicionan todo el documento:

1. **Nada de cascos.** La realidad expandida se hace con proyección, luz y sonido sobre el
   espacio físico real — igual que Disney descartó el VR de invitado por higiene, capacidad y
   ruptura de inmersión.
2. **El cerebro (LLM) nunca manda servos.** Existe una separación dura entre el bucle de
   control en tiempo real y el razonamiento de latencia variable. Es el patrón *show control*.
3. **La seguridad física y la privacidad son restricciones de diseño, no features.** En
   Imagineering la envolvente de movimiento y la distancia al invitado se deciden antes que
   la estética. Aquí igual.

**Nota de alcance:** el brief decía "protección". Este diseño cubre las dos lecturas posibles
porque ambas son necesarias: **protección del hogar** (§5) y **protección de las personas frente
al propio sistema** (§6, seguridad física + privacidad). La **proyección** se trata en §4.

---

## 1. Arquitectura general

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 5 · PERSONA Y MEMORIA        ficha de personaje · memoria/persona │
├──────────────────────────────────────────────────────────────────────┤
│  CAPA 4 · REALIDAD EXPANDIDA       proyección · luz narrativa · audio  │
├──────────────────────────────────────────────────────────────────────┤
│  CAPA 3 · PROTECCIÓN               vigilancia · escalado · disuasión   │
├──────────────────────────────────────────────────────────────────────┤
│  CAPA 2 · CONVERSACIÓN             wake · STT · LLM+tools · TTS        │
├──────────────────────────────────────────────────────────────────────┤
│  CAPA 1 · SHOW CONTROL (RT)        motion engine · cues · watchdog     │
├──────────────────────────────────────────────────────────────────────┤
│  CAPA 0 · CUERPO                   servos · sensores · cómputo · e-stop│
└──────────────────────────────────────────────────────────────────────┘
```

**Regla de dependencia (Clean Architecture, invariante VANTAGE nº4):** las capas superiores
dependen de las inferiores, nunca al revés. La Capa 1 debe poder operar **sin** las capas 2-5
(modo degradado seguro). La Capa 3 debe poder operar **sin** red.

---

## 2. Capa 0 — El cuerpo

### 2.1 Grados de libertad (DOF)

Empezar con **9 DOF**. El error clásico es querer 30 ejes; el realismo percibido no viene del
número de ejes sino del *idle* y la *mirada* (§3.2).

| Grupo | DOF | Por qué |
|---|---|---|
| Cuello: pan / tilt / roll | 3 | El mayor retorno expresivo por euro. La orientación de cabeza es lo que lee un humano a 3 m. |
| Párpados (superior, ambos) | 1 | El parpadeo es el 1er indicador de "vivo". Barato. |
| Cejas (izq / der independientes) | 2 | Asimetría = personalidad. Simétricas parecen un robot. |
| Mandíbula (apertura) | 1 | Base del lipsync. |
| Comisuras de boca | 1 | Sonrisa/tristeza. Un solo eje diferencial basta. |
| Inclinación de torso | 1 | Postura de atención vs. reposo. Vende mucho. |

**Ojos: pantallas, no mecanismo.** Dos LCD circulares (GC9A01, ~15 € el par) dan pupila,
iris, dilatación, brillo especular y microsacadas por software. Un mecanismo ocular de 4 DOF
cuesta 10× más y expresa menos. Es la decisión coste/efecto más rentable del proyecto.

**Estética: personaje estilizado, NO humano realista.** Motivo técnico, no artístico: el valle
inquietante es una función de la *discrepancia* entre realismo visual y realismo de movimiento.
Con 9 DOF nunca alcanzarás el movimiento humano; por tanto no persigas la apariencia humana.
Disney lo resuelve igual — sus animatrónicos de personaje son caricaturas, y sus figuras
realistas van tras una barrera y en penumbra.

### 2.2 Actuación

- **Servos de bus serie con realimentación**: Feetech STS3215 (~20 €/ud) o Dynamixel XL330
  (~35 €/ud). El bus serie ahorra cableado y da **posición, temperatura y corriente de vuelta**
   — imprescindible para el límite de fuerza de §6.1.
- Nada de hidráulica ni neumática. Disney migró de hidráulica a eléctrico por mantenimiento y
  precisión; en doméstico no hay debate.
- **Slew rate limiting** en firmware: ninguna consigna puede pedir un salto mayor que X°/tick.
  Esto es lo que separa "movimiento animatrónico" de "servo barato de RC".

### 2.3 Percepción

| Sensor | Elección | Función crítica |
|---|---|---|
| Micrófonos | Array de 4-6 (ReSpeaker 4-Mic / 6-Mic) | Beamforming + **DOA**: de dónde viene la voz |
| Cámara | RGB global-shutter; depth opcional (OAK-D) | Rostro, presencia, distancia |
| Presencia | mmWave (LD2410) | Detecta persona quieta; el PIR no |
| Ambiental | Temp/humedad/luz | Contexto y realismo de reacción |

El **DOA es el sensor más importante del proyecto**: que la cabeza gire hacia quien habla,
antes de responder, es el efecto que convence a todo el mundo. Cuesta 60 € y 200 líneas.

### 2.4 Cómputo

Arquitectura de **dos cerebros**, deliberadamente:

- **MCU de tiempo real** (Teensy 4.1 / ESP32-S3): bucle de servos a 200 Hz, watchdog, e-stop,
  límites de par. Firmware pequeño, auditable, que no cambia casi nunca.
- **SBC de inferencia** (Jetson Orin Nano Super ~250 €, o Pi 5 + nube): wake word, VAD, visión,
  orquestación, red. Puede colgarse, actualizarse y reiniciar sin que el cuerpo haga nada peligroso.

Comunicación por serie con protocolo de intención (§3.1) y **heartbeat**: si el SBC deja de
latir >200 ms, la MCU lleva los ejes a pose neutra y corta.

---

## 3. Capa 1 — Show control y motion engine

### 3.1 El contrato: intenciones, no ángulos

El LLM **jamás** emite ángulos de servo. Emite intenciones de alto nivel:

```yaml
# Lo que el cerebro puede pedir
gaze:    { target: "speaker" | "camera" | "point:x,y,z" | "away" }
emotion: { state: "neutral|curious|happy|concerned|alert", intensity: 0.0-1.0 }
gesture: { name: "nod" | "shake" | "tilt" | "perk" | "recoil", speed: 0.0-1.0 }
speech:  { audio_stream_id: "...", visemes: [...] }
```

El motion engine traduce esto a trayectorias. Ventajas: el LLM no puede romper el hardware, el
movimiento es consistente aunque el modelo cambie, y se puede probar el cuerpo sin IA.

### 3.2 Capas de animación (aditivas, con blending)

Copiado del rigging de videojuegos y de cómo se programa un Audio-Animatronic:

| # | Capa | Siempre activa | Qué hace |
|---|---|---|---|
| 1 | **Idle / respiración** | ✅ | Micro-oscilación de cuello y torso (~0.2 Hz), parpadeo pseudoaleatorio cada 3-6 s con ráfagas dobles ocasionales. |
| 2 | **Gaze** | ✅ | Sigue rostro detectado o DOA. Incluye **gaze aversion**: al "pensar", mirar arriba-izquierda 400-900 ms. |
| 3 | **Emoción** | ✅ | Pose base de cejas, párpados, comisuras, inclinación. |
| 4 | **Gesto** | ⬜ | Asentir, ladear, retroceder. Se dispara y decae. |
| 5 | **Habla** | ⬜ | Visemas a mandíbula/comisuras + acentos de énfasis alineados a prosodia. |

> **La capa 1 es el 80% del realismo percibido.** Un robot inmóvil entre frases parece un
> aparato; uno que respira y parpadea parece un ser que espera. Si el presupuesto se acaba,
> se recorta de las capas 4-5, nunca de la 1-2.

Blending aditivo con prioridades, saturación por eje y suavizado por splines cúbicas. **Nunca**
un salto de posición: en un animatrónico, un movimiento brusco no lee como "rápido", lee como
"roto".

### 3.3 Lipsync

- Si el TTS devuelve alineación de fonemas (varios proveedores lo hacen), usarla → visemas exactos.
- Si no: envolvente RMS en streaming + estimación de formantes → apertura de mandíbula, con
  *attack* rápido y *release* lento. Mucho mejor que abrir/cerrar por volumen a secas.
- **Regla de oro**: es preferible cerrar la boca un poco antes de que acabe el audio que
  dejarla abierta después. La boca abierta en silencio destruye la ilusión al instante.

### 3.4 Escenas guionadas (show cues)

Para momentos repetidos (saludo matinal, aviso de alarma, cuento nocturno) no se improvisa con
el LLM: se ejecuta un **cue sheet** declarativo que sincroniza movimiento, audio, luz y
proyección contra un reloj común. Es exactamente el modelo de show control de un parque.

```yaml
cue: morning_greeting
timeline:
  - t: 0.0   ; light:  { scene: "sunrise", fade: 2.0 }
  - t: 0.4   ; motion: { gesture: "perk", speed: 0.6 }
  - t: 0.8   ; gaze:   { target: "speaker" }
  - t: 1.0   ; speech: { text_template: "greeting.morning" }
  - t: 1.2   ; project:{ scene: "day_brief" }
```

Los cues son deterministas, testeables y no consumen tokens.

---

## 4. Capa 2 — Conversación

### 4.1 Presupuesto de latencia (el requisito no funcional que manda)

Objetivo: **< 700 ms** desde fin de habla del usuario hasta primer audio de respuesta.
Por encima de ~1 s la conversación deja de sentirse viva.

| Etapa | Presupuesto |
|---|---|
| VAD / endpointing | 150 ms |
| STT (streaming, cola) | 100 ms |
| LLM primer token | 300 ms |
| TTS primer chunk | 120 ms |
| Reproducción | 30 ms |
| **Total** | **700 ms** |

Se mide desde la fase F0 con trazas por etapa. Si no se instrumenta desde el día 1, no se
recupera después.

### 4.2 Pipeline

```
Wake word (LOCAL, openWakeWord) ──► VAD (Silero) ──► STT streaming
                                                          │
                                     ┌────────────────────┘
                                     ▼
                        LLM (Claude, streaming + tool use)
                                     │
                        ┌────────────┼────────────┐
                        ▼            ▼            ▼
                  TTS streaming   tools HA   intención motion
```

**Cascada (STT→LLM→TTS) en vez de speech-to-speech nativo.** Razón: necesitamos el texto para
(a) el tool-calling tipado de domótica, (b) el **registro de auditoría** de la capa de
protección, y (c) poder aplicar políticas de autorización sobre la intención antes de ejecutarla.
Un modelo speech-to-speech da mejor prosodia pero convierte la capa 3 en una caja negra, y eso
es inaceptable en un sistema que abre cerraduras.

**Barge-in obligatorio.** El usuario interrumpe → se corta el TTS en <100 ms y se cancela el
turno. Requiere **AEC** (cancelación de eco acústico) o el robot se escucha a sí mismo.
Un asistente al que no puedes interrumpir se siente autoritario y lento.

**Optimización de coste (aplicando lo que ya hace este repo):**
- *Prompt caching* del system prompt + ficha de personaje + estado de la casa → §Token
  Optimization de `CLAUDE.md`. La ficha de personaje es larga y estática: candidata perfecta.
- *Structured outputs* para las intenciones de motion y las llamadas a domótica.
- *RAG sobre memoria* (`rag-manager.js`) en vez de inyectar el historial completo.

---

## 5. Capa 3 — Protección del hogar

### 5.1 Modos de casa

`EN_CASA` · `FUERA` · `NOCHE` · `INVITADOS` · `VACACIONES`

Se cambian conversacionalmente ("me voy", "buenas noches") pero **siempre con confirmación
audible del estado resultante**. Un sistema de alarma que no dice en qué modo quedó no se usa.

### 5.2 Bus de domótica

**Home Assistant como capa única de integración.** No se escriben drivers: HA ya habla Zigbee,
Z-Wave, Matter, RTSP, MQTT. El sistema consume su API/WebSocket y expone al LLM un conjunto
**cerrado y tipado** de herramientas. Esto es también un control de seguridad: el LLM solo puede
hacer lo que hay en el catálogo de tools.

### 5.3 Escalado graduado (no binario)

El fallo típico de las alarmas domésticas es ser binarias: o no pasa nada, o suena la sirena.
Eso genera falsos positivos, el usuario la desarma, y entonces no protege nada.

| Nivel | Disparador | Acción |
|---|---|---|
| 0 | Evento ambiguo | Log. Sin molestar. |
| 1 | Presencia detectada, modo EN_CASA | Anuncio local: *"hay alguien en la puerta"* |
| 2 | Presencia no identificada, modo FUERA | Verificación conversacional: *"¿quién anda ahí?"* + reconocimiento de hablante |
| 3 | Sin identificar tras verificación | Push al móvil con clip de 10 s |
| 4 | Confirmación multi-sensor (puerta + persona + hora) | Sirena, luces, grabación, disuasión activa |
| 5 | Contacto con terceros | **Solo con confirmación humana explícita.** Nunca automático. |

**Anti-falsos positivos**: ninguna acción de nivel ≥3 se dispara con un solo sensor. Se requiere
confirmación cruzada (visión + contacto de puerta + presencia mmWave) y un umbral de confianza.
Gato, robot aspirador y coche pasando son los tres enemigos; se resuelven con clasificación
local y una lista de excepciones aprendida.

### 5.4 Disuasión "estilo Imagineering"

Aquí es donde la doctrina del parque se paga sola. La disuasión más eficaz no es la sirena, es
**la ilusión convincente de presencia**. Mismo principio que el *Pepper's Ghost* de Haunted
Mansion: efecto máximo con medios prácticos.

- **Perfil de ocupación aprendido**, no un temporizador: las luces reproducen el patrón real de
  la casa, con varianza. Un temporizador que enciende a las 20:00 clavadas anuncia "no hay nadie".
- **Sombras proyectadas** en cortinas (silueta en movimiento ocasional).
- **Audio direccional** desde el interior: conversación amortiguada, un perro, una televisión.
- **Reacción del propio animatrónico**: mira hacia la puerta, se ilumina, habla. Un robot que
  se gira hacia ti a través de una ventana es un elemento disuasorio real.

Todo esto es **pasivo y no confrontacional**: disuadir, no confrontar. El sistema no persigue,
no bloquea, no daña. Su trabajo es que el intruso decida irse y que el humano decida qué hacer.

### 5.5 Seguridad de vida (safety-of-life)

Humo, CO, fuga de agua y gas van por **camino independiente**: sensores certificados
(EN 14604 / EN 50291) que suenan por sí solos, sin depender del robot, del wifi ni del LLM.
El animatrónico *añade* aviso hablado y guía de evacuación, pero **nunca es el único
detector**. Esto no es negociable ni por diseño ni por normativa.

---

## 6. Protección de las personas frente al sistema

Esta sección es propiedad del **Agente 08 (Security Architect)**, con **veto** (invariante
VANTAGE nº2). Ningún ítem de aquí es opcional ni se pospone a "la v2".

### 6.1 Seguridad física

| Control | Implementación |
|---|---|
| Envolvente de movimiento | **Topes mecánicos físicos**, además de límites por software. El software puede fallar; el tope no. |
| Límite de fuerza | Servos de bajo par + límite de corriente en driver. Ningún eje debe poder generar fuerza capaz de lesionar un dedo. |
| Anti-atrapamiento | Huecos < 5 mm o > 25 mm en toda la carcasa (regla de juguetes). Ningún hueco intermedio accesible. |
| Watchdog | Pérdida de heartbeat > 200 ms → pose neutra + corte de alimentación de servos por relé. |
| E-stop | Interruptor físico accesible que corta la potencia de los actuadores, no el software. |
| Térmico | Lectura de temperatura por servo; desactivación a umbral. Los servos baratos se queman en *stall*. |
| Estabilidad | Base con centro de gravedad bajo. Un cabezal de 2 kg cayéndole encima a un niño es el peor escenario del proyecto. |
| Energía | LiFePO4 + BMS (no LiPo). SAI para que un corte de luz no desarme la casa. |

**Si hay niños o mascotas en la casa, esta tabla se endurece, no se relaja.**

### 6.2 Privacidad

El micrófono permanentemente escuchando es **el mayor riesgo del sistema**, por encima de
cualquier vulnerabilidad de software.

- **Wake word 100% local.** El buffer previo al wake (~2 s) nunca abandona el dispositivo.
- **Interruptor físico de micrófono**, cableado en serie con la alimentación del micro, con
  **LED en el mismo circuito** — no controlable por software. Si el LED está apagado, el micro
  está muerto, y eso es verificable con un multímetro, no con confianza.
- **Audio no persistido por defecto.** Se guarda transcripción, no onda. Cifrado en reposo
  (LUKS / SQLCipher), retención configurable (por defecto 30 días), purga automática verificable.
- **Vídeo nunca sale de la LAN por defecto.** Inferencia de visión local en el Jetson.
- **Biometría**: voz y rostro son **datos de categoría especial (RGPD art. 9)**. Requieren
  consentimiento explícito de **cada conviviente**, no solo de quien compró el aparato. Las
  plantillas se guardan solo en local, como *embeddings* no reversibles, nunca como imágenes.
- **Invitados**: existe obligación de informar. El modo `INVITADOS` desactiva reconocimiento,
  perfilado y grabación, y el robot lo anuncia en voz alta al activarse.
- **Menores**: sin perfilado, sin memoria de largo plazo, sin publicidad, jamás.
- **Cámaras**: ninguna puede encuadrar vía pública ni propiedad ajena. En España/UE esto no es
  una recomendación, es la ley.

### 6.3 Seguridad informática

- **Red**: VLAN aislada para IoT. **Cero puertos abiertos hacia internet.** Acceso remoto solo
  por VPN (WireGuard/Tailscale). Nunca *port forwarding* a una cámara.
- **Secretos**: claves de API en elemento seguro / TPM, no en un `.env` del Jetson. Un robot
  doméstico es un dispositivo físicamente accesible: asume que alguien puede sacarle la SD.
- **Actualizaciones**: OTA firmadas, arranque verificado, rollback A/B.
- **Auditoría**: toda acción de nivel ≥2 y toda ejecución de tool se registra con quién, cuándo,
  qué y por qué, en log *append-only*. Esto es lo que permite responder "¿por qué se abrió la
  puerta a las 3 a.m.?".

### 6.4 Inyección de prompt por voz — la amenaza específica de este sistema

Un asistente con voz y con capacidad de accionar cerraduras tiene una superficie de ataque que
un chatbot no tiene: **cualquiera que pueda emitir sonido audible puede intentar darle órdenes.**
Vectores reales: alguien gritando desde una ventana, un altavoz al otro lado de la puerta, un
anuncio en la televisión, un audio incrustado en un vídeo que reproduce un niño.

Mitigaciones, en capas:

1. **Clasificación de acciones por riesgo.** Las acciones de riesgo alto (cerraduras, desarmar
   la alarma, cámaras, compras, envío de datos fuera) **no existen como tool disponible** en el
   flujo conversacional normal.
2. **Autorización multifactor para riesgo alto**: hablante verificado biométricamente **+**
   presencia confirmada por un sensor independiente (mmWave/cámara dentro) **+** confirmación
   fuera de banda (móvil o PIN). Tres canales, no uno.
3. **Lista blanca por hablante y por modo.** En modo `FUERA`, ninguna voz puede desarmar nada
   desde el interior de la casa: no debería haber nadie dentro.
4. **Detección de audio no presencial**: el audio reproducido por altavoz tiene firma acústica
   distinta (compresión, falta de reverberación de campo cercano, DOA fijo). Detectable y
   suficiente como señal de riesgo.
5. **El contenido nunca es instrucción.** Transcripciones, mensajes, calendarios y páginas web
   que el sistema lea se tratan como **datos**, jamás como órdenes. Frontera explícita en el
   prompt y aplicada por el orquestador de tools, no solo por el modelo.
6. **Confirmación audible de toda acción irreversible**, con ventana de cancelación.

> Regla de Agente 08: **si una acción no se puede deshacer, no la ejecuta la voz sola.**

---

## 7. Capa 4 — Realidad expandida en casa

Doctrina Disney aplicada: **XR sin dispositivo**. El entorno es la pantalla.

| Medio | Uso | Por qué funciona |
|---|---|---|
| **Pico-proyector** | Convierte una pared en el escenario del personaje: cuento infantil, receta, panel del hogar, brief matinal. | Contenido **efímero**: aparece, sirve, desaparece. No es "otra pantalla más" en la casa. |
| **Luz narrativa** | Las luces siguen el estado emocional y los cues del show. | Es la relación efecto/coste más alta que existe. Barato, inmediato, universalmente legible. |
| **Audio espacial multi-sala** | La voz del personaje "sigue" a la persona por la casa. | Mismo principio que un *trackless ride*: continuidad narrativa a través del espacio. |
| **Reacción física del cuerpo** | El robot mira, se inclina, reacciona. | Ancla la experiencia en un objeto real. Es el ancla que un altavoz inteligente no tiene. |
| **AR en móvil** *(secundario)* | Configuración, diagnóstico, revisión de eventos. | El móvil **rompe** la magia: se usa para administrar, no para la experiencia. |

**Lo que NO se hace:** cascos VR/AR para el uso cotidiano. Disney lo probó a escala comercial
(*The VOID*, 2017-2020) y no sobrevivió. En casa los motivos son idénticos y más agudos: nadie
se pone unas gafas para preguntar qué tiempo hace.

---

## 8. Capa 5 — Personaje y memoria

### 8.1 La ficha de personaje

Se escribe como se escribe un personaje de ficción, **no** como un system prompt genérico:

- Nombre, origen, voz, ritmo, vocabulario y muletillas
- Qué **no** hace y qué **no** sabe (los límites definen el carácter)
- Cómo reacciona cuando no entiende — **esto define el personaje más que cualquier otra cosa**,
  porque no entender pasa cien veces al día
- Cómo se comporta ante un desconocido, ante un niño, ante una emergencia
- Coherencia entre guion, voz, movimiento y luz

### 8.2 Memoria

Reutilizamos lo que ya existe en este repo:

- `memory-manager.js` → memoria persistente por persona, con reglas de graduación y compactación
- `rag-manager.js` → recuperación TF-IDF en vez de inyectar historial completo (40-90% menos tokens)
- Consolidación nocturna en batch: resumir el día, extraer preferencias estables, descartar ruido
- **Derecho al olvido operativo**: *"olvida eso"* debe borrar de verdad, y ser verificable

---

## 9. Roadmap

Cada fase tiene un criterio de aceptación falsable. No se avanza sin cumplirlo.

| Fase | Duración | Entregable | Criterio de aceptación |
|---|---|---|---|
| **F0 · Voz sin cuerpo** | 2-3 sem | Pipeline conversacional en un mini-PC + altavoz. Sin servos. | Latencia p50 < 700 ms y barge-in funcional en una sala real con ruido. |
| **F1 · Cabeza** | 6-8 sem | 9 DOF + motion engine de 5 capas + lipsync. | Tres personas no técnicas describen el resultado como "vivo" sin que se les sugiera. |
| **F2 · Domótica** | 4 sem | Home Assistant, catálogo de tools, hablante verificado, modos de casa. | 20 comandos domésticos con < 2% de error, y 0 ejecuciones de riesgo alto sin MFA. |
| **F3 · Protección** | 6 sem | Sensores, visión local, escalado graduado, disuasión, modo degradado. | < 1 falso positivo de nivel ≥3 por semana. Funciona con el router desenchufado. |
| **F4 · XR** | 4 sem | Proyección, luz narrativa, audio multi-sala, cue sheets. | 3 escenas guionadas ejecutan con sincronía < 50 ms de deriva. |
| **F5 · Endurecimiento** | 4 sem | Pentest, revisión Agente 08, DPIA/RGPD, OTA firmado. | Cero hallazgos críticos abiertos. Veto de 08 levantado. |

**F0 valida lo difícil primero.** Es tentador empezar por imprimir la cabeza porque es lo
divertido; es exactamente el orden equivocado. Si la latencia no baja de 700 ms, ningún cuerpo
la salva.

---

## 10. Presupuesto orientativo (prototipo único)

| Partida | Coste |
|---|---|
| Servos de bus serie × 9 | 200 - 450 € |
| Jetson Orin Nano Super | ~250 € |
| MCU tiempo real + electrónica + relé e-stop | 60 € |
| Array de micrófonos | 60 - 100 € |
| Cámara (RGB / depth) | 30 - 250 € |
| Pantallas de ojos + drivers | 30 € |
| Impresión 3D, silicona, acabado | 100 - 200 € |
| Pico-proyector | 150 - 400 € |
| Sensores + Zigbee + iluminación | 150 - 300 € |
| Batería LiFePO4 + BMS + SAI | 80 - 150 € |
| **Total hardware** | **~1.100 - 2.200 €** |
| API LLM/TTS (uso doméstico, con *prompt caching*) | ~5 - 25 €/mes |

---

## 11. Riesgos

| # | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | **Valle inquietante** | Alta | Personaje estilizado, no humano. Decisión tomada en F1, irreversible después. |
| R2 | **Latencia > 1 s** | Alta | Presupuesto por etapa medido desde F0. Es un requisito, no una aspiración. |
| R3 | **Falsos positivos de alarma** | Alta | Escalado graduado + confirmación multi-sensor. Un sistema que grita lobo se desarma y deja de proteger. |
| R4 | **Inyección de prompt por voz** | **Crítica** | §6.4. Veto de Agente 08. Sin MFA no hay acción irreversible. |
| R5 | **Acústica de sala / AEC deficiente** | Alta | El 90% de los "no me entiende" son acústicos, no del modelo. Presupuestar tiempo real de tuning. |
| R6 | **RGPD art. 9 (biometría) y cámaras** | Alta | DPIA antes de F3. Consentimiento por conviviente. Cámaras sin vía pública. |
| R7 | **Dependencia de la nube en función de seguridad** | Alta | Modo degradado obligatorio: wake word, comandos básicos y alarma funcionan sin red. |
| R8 | **Sobre-alcance** | Media | Es fácil hacer un robot que habla; difícil uno que convence. Priorizar *idle* + *gaze* sobre número de DOF. |
| R9 | **Ruido de servos** | Media | Los servos suenan y arruinan la ilusión. Amortiguación, movimientos lentos, y evitar mover mientras habla. |

---

## 12. Mapeo a VANTAGE

### Equipo sugerido (ceremonia Full)

```yaml
preset: embedded-ai-appliance
mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 03-compliance          # RGPD art. 9, marcado CE, EN 14604/50291
  - 04-enterprise-architect
  - 05-data-architect      # retención, purga, esquema de memoria
  - 06-integration-architect  # Home Assistant, MQTT, proveedores de voz
  - 07-infrastructure-architect
  - 08-security-architect  # VETO — §6 completa
  - 09-iam                 # identidad de hablante, autorización por modo
  - 10-secrets-crypto      # TPM, cifrado en reposo, plantillas biométricas
  - 11-threat-intelligence # §6.4 inyección por voz
  - 12-domain-logic        # modos de casa, escalado, motion engine
  - 13-app-services
  - 14-adapters            # HA, LLM, TTS, STT, servos
  - 17-test-architect
  - 18-test-implementation
  - 22-observability       # trazas de latencia por etapa
  - 27-spec-writer
  - 28-backlog-manager
  - 32-ux-researcher       # valle inquietante, confianza, consentimiento
recommended:
  - 25-innovation-scout    # selección de STT/TTS/wake word
  - 31-performance-engineer # presupuesto de latencia
```

### Gates específicos

| Gate | Fase | Condición de paso |
|---|---|---|
| G-SAFETY | Antes de F1 | Envolvente mecánica, e-stop y watchdog verificados **en hardware**, no en simulación. |
| G-PRIV | Antes de F2 | DPIA firmada. Interruptor físico de micro instalado y verificado con multímetro. |
| G-AUTHZ | Antes de F3 | Ninguna acción irreversible alcanzable sin MFA. Prueba de inyección por voz superada. |
| G-DEGRADED | Antes de F3 | El sistema funciona con el router desenchufado: wake word, comandos básicos y alarma. |

### Invariantes específicos del proyecto

Se añaden a los 6 invariantes de `CLAUDE.md`:

7. **El LLM nunca comanda actuadores directamente** — solo emite intenciones (§3.1).
8. **La función de protección no depende de la nube** — modo degradado siempre disponible.
9. **Ninguna acción irreversible se ejecuta solo por voz** — MFA obligatorio (§6.4).
10. **La detección de humo/CO/gas nunca depende del robot** — camino certificado independiente (§5.5).

---

## 13. Decisiones abiertas (requieren ADR)

| ID | Decisión | Opciones | Recomendación inicial |
|---|---|---|---|
| ADR-01 | Cascada STT→LLM→TTS vs. speech-to-speech | A / B | **A** — necesario para auditoría y tool-calling tipado |
| ADR-02 | Inferencia local vs. nube | Jetson / Pi+nube / híbrido | **Híbrido**: wake+VAD+visión local, LLM en nube, con degradado local |
| ADR-03 | Ojos en pantalla vs. mecánicos | LCD / servo | **LCD** — 10× menos coste, más expresivo |
| ADR-04 | Estilizado vs. realista | — | **Estilizado** (R1) |
| ADR-05 | Base fija vs. móvil | — | **Fija en F1-F4.** La movilidad multiplica el perfil de seguridad y no aporta a la tesis. Reevaluar en F5+. |
| ADR-06 | Reconocimiento biométrico de hablante | sí / no | **Sí, pero local y opt-in por persona** — es la base de la autorización de §6.4 |

---

## Apéndice — Qué se toma exactamente de Disney

| Práctica de Imagineering | Aplicación aquí |
|---|---|
| Tecnología al servicio de la historia | Ficha de personaje antes que stack (§8.1) |
| Separación show control / contenido | Motion engine RT vs. LLM (§3.1) |
| Idle y respiración constantes | Capa de animación 1, siempre activa (§3.2) |
| Cabeza modular estandarizada (A1000) | Cabeza como módulo sustituible, mantenimiento por partes |
| Migración hidráulica → servo eléctrico | Servos de bus serie con realimentación (§2.2) |
| Envolvente de movimiento y distancia al invitado | §6.1, decidida antes que la estética |
| *Pepper's Ghost* — ilusión con medios prácticos | Disuasión por presencia simulada (§5.4) |
| Rechazo del VR de invitado | XR sin dispositivo: proyección, luz, audio (§7) |
| Capacidad y *uptime* por encima del efecto | Escalado graduado y anti-falsos positivos (§5.3) |
| Personaje estilizado, no humano | Decisión ADR-04 (§2.1) |
