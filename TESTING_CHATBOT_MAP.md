# 🧪 Pruebas de Integración Chatbot-Mapa

## Pruebas Básicas

### ✅ Test 1: Búsqueda de Banorte sin especificar ubicación
```
📱 Usuario escribe: "¿Dónde hay un Banorte?"

✅ Esperado:
- Bot responde: "¡Claro! Te abro el mapa con los Banorte más cercanos."
- Aparece botón rojo "Abrir Mapa"
- Al presionar: Mapa se abre con type=bank
- Mapa muestra Banorte cercanos a la ubicación actual
```

### ✅ Test 2: Búsqueda de SAT sin especificar ubicación
```
📱 Usuario escribe: "¿Dónde está el SAT más cercano?"

✅ Esperado:
- Bot responde: "Te muestro las oficinas del SAT en tu zona."
- Aparece botón rojo "Abrir Mapa"
- Al presionar: Mapa se abre con type=sat
- Mapa muestra oficinas del SAT cercanas
```

### ✅ Test 3: Búsqueda con ubicación específica (Banorte)
```
📱 Usuario escribe: "Busca un Banorte en Reforma"

✅ Esperado:
- Bot responde: "Busco Banorte en Reforma para ti."
- Aparece botón rojo "Abrir Mapa"
- Al presionar: Mapa se abre con type=bank&query=Reforma
- Mapa busca "Banorte Reforma"
```

### ✅ Test 4: Búsqueda con ubicación específica (SAT)
```
📱 Usuario escribe: "Muéstrame oficinas del SAT en Centro"

✅ Esperado:
- Bot responde: "Te muestro oficinas del SAT en el Centro."
- Aparece botón rojo "Abrir Mapa"
- Al presionar: Mapa se abre con type=sat&query=Centro
- Mapa busca "SAT Centro"
```

## Pruebas de Variaciones de Lenguaje

### ✅ Test 5: Variaciones de pregunta para Banorte
```
📱 "Necesito ir a un banco"
📱 "¿Hay algún Banorte cerca?"
📱 "Muéstrame bancos"
📱 "Dónde encuentro un Banorte"
📱 "Llévame a un banco"

✅ Todas deben abrir el mapa con type=bank
```

### ✅ Test 6: Variaciones de pregunta para SAT
```
📱 "Necesito ir al SAT"
📱 "¿Hay oficina del SAT cerca?"
📱 "Muéstrame el SAT"
📱 "Dónde está el servicio de administración tributaria"
📱 "Llévame al centro tributario"

✅ Todas deben abrir el mapa con type=sat
```

## Pruebas de Integración

### ✅ Test 7: Conversación mixta
```
📱 Usuario: "¿Cómo saco mi RFC?"
🤖 Bot: [Respuesta sobre RFC sin botón de mapa]

📱 Usuario: "¿Y dónde lo tramito?"
🤖 Bot: "Te muestro las oficinas del SAT cercanas."
[Botón: Abrir Mapa]

✅ El bot debe entender el contexto y mostrar el mapa
```

### ✅ Test 8: Multiple ubicaciones en misma conversación
```
📱 Usuario: "¿Dónde hay un Banorte?"
🤖 Bot: [Mensaje + Botón Mapa para Banorte]

📱 Usuario: "¿Y dónde está el SAT?"
🤖 Bot: [Mensaje + Botón Mapa para SAT]

✅ Ambos mensajes deben tener su respectivo botón
✅ Cada botón debe abrir el tipo correcto de lugar
```

## Pruebas de UI/UX

### ✅ Test 9: Diseño del botón
```
✅ Verificar:
- Botón es rojo (#FF0000)
- Tiene ícono de mapa (map-marker)
- Texto es legible ("Abrir Mapa")
- Tiene padding adecuado (8px vertical, 12px horizontal)
- Border radius es 16px
- Aparece debajo del texto del mensaje
```

### ✅ Test 10: Interacción del botón
```
✅ Verificar:
- Al presionar se siente el feedback háptico (opcional)
- Navegación es instantánea
- No hay parpadeos o glitches
- El mapa se abre con animación suave
```

## Pruebas de Casos Edge

### ✅ Test 11: Sin conexión a internet
```
📱 Usuario: "¿Dónde hay un Banorte?"
[Desconectar WiFi/Datos]

✅ Esperado:
- Bot muestra mensaje de error
- O mensaje queda en "pendiente"
- Al reconectar, se procesa correctamente
```

### ✅ Test 12: Sin permisos de ubicación
```
📱 Usuario presiona "Abrir Mapa"
[Permisos de ubicación denegados]

✅ Esperado:
- Mapa solicita permisos
- O muestra ubicación predeterminada (CDMX)
- Muestra mensaje claro al usuario
```

### ✅ Test 13: Base de datos offline
```
[Supabase no disponible]
📱 Usuario: "¿Dónde hay un Banorte?"

✅ Esperado:
- Banner amarillo: "Modo local"
- Mensaje se guarda localmente
- Botón de mapa funciona igual
```

### ✅ Test 14: Historial restaurado
```
1. Usuario pregunta ubicaciones
2. Cerrar la app
3. Abrir la app nuevamente

✅ Esperado:
- Mensajes con botones se restauran correctamente
- Los botones siguen funcionando
- Deep links persisten en la BD
```

## Pruebas de Performance

### ✅ Test 15: Tiempo de respuesta
```
📱 Usuario: "¿Dónde hay un Banorte?"

✅ Medir:
- Tiempo hasta ver "Escribiendo..." < 500ms
- Tiempo hasta ver respuesta < 3s
- Tiempo de navegación al mapa < 500ms
- Tiempo de carga del mapa < 2s
```

### ✅ Test 16: Múltiples mensajes rápidos
```
📱 Usuario escribe rápidamente:
"¿Dónde hay un Banorte?"
"¿Y el SAT?"
"Busca en Polanco"

✅ Esperado:
- Todos los mensajes se procesan
- Los botones aparecen en todos
- No hay bloqueos o crashes
```

## Checklist de Funcionalidad

### Detección en el MCP
- [ ] MCP detecta "banorte", "banco", "sucursal"
- [ ] MCP detecta "sat", "centro tributario", "oficina del sat"
- [ ] MCP detecta verbos: "dónde", "busca", "muestra", "hay"
- [ ] MCP extrae ubicación específica: "en Reforma", "cerca de Polanco"
- [ ] MCP genera deep link correcto

### Lambda Bridge
- [ ] Bridge recibe respuesta del MCP
- [ ] Bridge extrae deep_link del data
- [ ] Bridge retorna estructura correcta al app

### Servicio de Chat (chat.ts)
- [ ] extractDeepLink() funciona correctamente
- [ ] extractAssistantText() obtiene el mensaje
- [ ] Deep link se guarda en payload de Supabase
- [ ] toUiMessage() extrae deep link del payload

### Componente Chat
- [ ] handleDeepLink() parsea URL correctamente
- [ ] handleDeepLink() navega con parámetros correctos
- [ ] Botón "Abrir Mapa" se renderiza cuando hay deep link
- [ ] Botón tiene estilos correctos (rojo, con ícono)
- [ ] Botón solo aparece en mensajes del bot

### Componente Mapa
- [ ] Recibe parámetros type, placeIdParam, searchQuery
- [ ] useEffect aplica el type del parámetro
- [ ] fetchPlaces() usa searchQueryParam en la búsqueda
- [ ] Mapa enfoca el lugar si viene placeId
- [ ] Google Places API retorna resultados correctos

## Scripts de Testing Automatizado

### Test de Deep Link Parsing
```typescript
// Copiar en chat component o crear test file
const testDeepLinkParsing = () => {
  const tests = [
    {
      input: "fiscai://map?type=bank",
      expected: { type: 'bank', placeId: 'i', query: '' }
    },
    {
      input: "fiscai://map?type=sat&query=Reforma",
      expected: { type: 'sat', placeId: 'i', query: 'Reforma' }
    },
    {
      input: "fiscai://map?type=bank&placeId=ChIJ123",
      expected: { type: 'bank', placeId: 'ChIJ123', query: '' }
    }
  ];

  tests.forEach(test => {
    const url = new URL(test.input);
    const type = url.searchParams.get('type');
    const placeId = url.searchParams.get('placeId') || 'i';
    const query = url.searchParams.get('query') || '';
    
    console.assert(
      type === test.expected.type &&
      placeId === test.expected.placeId &&
      query === test.expected.query,
      `Failed: ${test.input}`
    );
  });
  
  console.log('✅ All deep link parsing tests passed');
};
```

### Test de Navegación
```typescript
// Agregar en chat component
const testNavigation = () => {
  const mockRouter = {
    push: jest.fn()
  };

  handleDeepLink("fiscai://map?type=bank&query=Reforma");
  
  expect(mockRouter.push).toHaveBeenCalledWith({
    pathname: '/(drawer)/(tabs)/stackmap',
    params: {
      type: 'bank',
      placeIdParam: 'i',
      searchQuery: 'Reforma'
    }
  });
  
  console.log('✅ Navigation test passed');
};
```

## Logs de Debugging

### Activar logs detallados
```typescript
// En chat.ts, agregar al inicio de extractDeepLink:
console.log('[DEBUG] extractDeepLink input:', JSON.stringify(resp, null, 2));

// En handleDeepLink:
console.log('[DEBUG] handleDeepLink called with:', deepLink);
console.log('[DEBUG] Parsed URL:', { type, placeId, query });

// En mapa index.tsx:
console.log('[DEBUG] Map params:', { typeParam, placeIdParam, searchQueryParam });
console.log('[DEBUG] Fetching places with keyword:', keyword);
```

## Resultados Esperados

### Ejemplo completo de logs exitosos:
```
[Chat] User message inserted { id: 'abc123', content: '¿Dónde hay un Banorte?' }
[MCP] Detección automática: requiere mapa tipo=bank
[MCP] Deep link generado: fiscai://map?type=bank
[Chat] Extracted assistant text: "¡Claro! Te abro el mapa con los Banorte..."
[Chat] hasDeepLink: true
[Chat] Assistant message inserted { id: 'def456', hasDeepLink: true }
[Chat] Realtime event { type: 'INSERT', role: 'assistant' }
[DEBUG] handleDeepLink called with: fiscai://map?type=bank
[DEBUG] Parsed URL: { type: 'bank', placeId: 'i', query: '' }
[Map] Setting search type from chat: bank
[Map] Fetching places with keyword: Banorte
[Map] Found 15 places
✅ SUCCESS: Mapa abierto con Banorte cercanos
```

## 🎯 Criterios de Aceptación

Para considerar la funcionalidad completa:

1. ✅ Usuario puede preguntar sobre ubicaciones en lenguaje natural
2. ✅ Bot responde con mensaje claro + botón visible
3. ✅ Botón navega al mapa correctamente
4. ✅ Mapa muestra lugares relevantes
5. ✅ Funciona con y sin query específica
6. ✅ Funciona tanto para bancos como SAT
7. ✅ Historial persiste en Supabase
8. ✅ Performance es fluida (<3s respuesta, <500ms navegación)

---

**Nota:** Ejecuta estas pruebas en orden y marca cada una al completarla. Si alguna falla, revisa los logs específicos de ese paso en el documento de troubleshooting.
