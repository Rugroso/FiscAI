# 🔧 Fix para el Error 'FunctionTool' object is not callable

## ❌ Problema

```
ERROR: 'FunctionTool' object is not callable
```

Esto ocurre porque intentas llamar directamente a `open_map_location` que está decorado con `@mcp.tool()`, pero FastMCP convierte las funciones en objetos FunctionTool que no son directamente invocables.

## ✅ Solución

### Opción 1: Crear función auxiliar sin decorador (RECOMENDADO)

En tu archivo `mcp_server/__main__.py`:

```python
# ====== FUNCIONES AUXILIARES (SIN DECORADORES) ======

async def _open_map_location_impl(
    location_type: str,
    place_id: Optional[str] = None,
    search_query: Optional[str] = None
) -> Dict[str, Any]:
    """
    Implementación real de open_map_location
    Esta función NO tiene el decorador @mcp.tool()
    """
    try:
        if location_type not in ["bank", "sat"]:
            return {
                'success': False,
                'error': "Tipo de ubicación inválido",
                'message': "location_type debe ser 'bank' o 'sat'"
            }
        
        base_url = "fiscai://map"
        params = [f"type={location_type}"]
        
        if place_id:
            params.append(f"placeId={place_id}")
        
        if search_query:
            params.append(f"query={search_query}")
        
        deep_link = f"{base_url}?{'&'.join(params)}"
        
        location_name = "Banorte" if location_type == "bank" else "oficinas del SAT"
        
        if place_id:
            message = f"Abriendo mapa enfocado en un {location_name} específico"
        elif search_query:
            message = f"Abriendo mapa buscando: {search_query}"
        else:
            message = f"Abriendo mapa con {location_name} cercanos"
        
        return {
            'success': True,
            'data': {
                'deep_link': deep_link,
                'location_type': location_type,
                'place_id': place_id,
                'search_query': search_query,
                'user_message': f"📍 {message}. El mapa se abrirá automáticamente."
            },
            'message': message
        }
        
    except Exception as error:
        return {
            'success': False,
            'error': str(error),
            'message': "Error generando enlace al mapa"
        }

# ====== HERRAMIENTAS MCP (CON DECORADORES) ======

@mcp.tool()
async def open_map_location(
    location_type: str,
    place_id: Optional[str] = None,
    search_query: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generar un deep link para abrir el mapa en la app.
    
    Esta es solo un wrapper que llama a la implementación real.
    """
    return await _open_map_location_impl(location_type, place_id, search_query)
```

### Ahora en `gemini.py`, importa y usa la función auxiliar:

```python
async def chat_with_assistant(
    self,
    message: str,
    user_context: Optional[Dict[str, Any]] = None,
    chat_history: List[Dict[str, Any]] = None,
    relevant_docs: List[Dict[str, Any]] = None
) -> str:
    """
    Chat con el asistente fiscal usando Gemini con detección automática de intenciones
    """
    try:
        # 1. DETECCIÓN AUTOMÁTICA DE INTENCIONES
        intent = detect_user_intent(message)
        
        # 2. SI ES UNA CONSULTA DE UBICACIÓN, LLAMAR A LA IMPLEMENTACIÓN
        if intent['requires_map']:
            print(f"[CHAT] Detección automática: requiere mapa tipo={intent['location_type']}")
            
            # Importar la implementación auxiliar (NO la decorada)
            from .__main__ import _open_map_location_impl
            
            # Llamar a la implementación directamente
            map_response = await _open_map_location_impl(
                location_type=intent['location_type'],
                search_query=intent['search_query']
            )
            
            if map_response['success']:
                # Retornar respuesta estructurada
                import json
                return json.dumps({
                    'text': map_response['data']['user_message'],
                    'deep_link': map_response['data']['deep_link'],
                    'tool_used': 'open_map_location',
                    'details': {
                        'location_type': intent['location_type'],
                        'search_query': intent['search_query']
                    }
                }, ensure_ascii=False)
            else:
                # Si falló, responder con error amigable
                import json
                return json.dumps({
                    'text': f"Lo siento, hubo un problema al generar el mapa: {map_response.get('message', 'Error desconocido')}",
                    'deep_link': None,
                    'tool_used': 'error',
                    'details': {}
                }, ensure_ascii=False)
        
        # 3. SI NO ES UBICACIÓN, CONTINUAR CON FLUJO NORMAL DE CHAT
        # ... resto del código igual
```

## 📁 Estructura de Archivos Actualizada

```
mcp_server/
├── __main__.py          # Servidor MCP principal
│   ├── _open_map_location_impl()  # Función auxiliar SIN decorador
│   └── @mcp.tool() open_map_location()  # Wrapper con decorador
│
├── gemini.py            # Cliente Gemini
│   ├── detect_user_intent()
│   ├── GeminiClient
│   └── chat_with_assistant()
│       └── from .__main__ import _open_map_location_impl  # ✅ Importa auxiliar
```

## 🧪 Testing

Después de hacer estos cambios, prueba:

```bash
# 1. Reiniciar el servidor MCP
cd mcp_server
python -m mcp_server

# 2. En la app, enviar mensaje
Usuario: "¿Dónde hay un Banorte?"

# 3. Verificar logs del servidor
# Debe mostrar:
[CHAT] Detección automática: requiere mapa tipo=bank
[MAP] Generando deep link: fiscai://map?type=bank
✅ SUCCESS
```

## 🔍 Por qué funciona

1. **Función auxiliar `_open_map_location_impl`**: Es una función Python normal, completamente invocable
2. **Wrapper decorado `open_map_location`**: Solo existe para que MCP la exponga como herramienta
3. **Gemini llama a la auxiliar**: Evita el error de FunctionTool no callable
4. **FastMCP llama al wrapper**: Cuando viene por protocolo MCP (no por detección de intent)

## 📊 Flujo Completo

```
Usuario: "¿Dónde hay un Banorte?"
    ↓
Lambda → MCP → chat_with_fiscal_assistant
    ↓
gemini.py → detect_user_intent()
    → requires_map: true
    ↓
gemini.py → _open_map_location_impl() ✅ (función normal)
    → genera deep_link
    ↓
Retorna JSON con deep_link
    ↓
Lambda → App → Chat component
    ↓
Botón "Abrir Mapa" aparece
    ↓
Usuario presiona
    ↓
Mapa se abre 🎉
```

## ⚠️ Importante

NO intentes llamar directamente a funciones decoradas con `@mcp.tool()`. Siempre crea una implementación auxiliar si necesitas invocarlas desde tu código Python.

## 🎯 Alternativa Simplificada

Si prefieres no crear funciones auxiliares, puedes construir la respuesta del mapa directamente en `gemini.py`:

```python
if intent['requires_map']:
    # Construir deep link directamente
    base_url = "fiscai://map"
    params = [f"type={intent['location_type']}"]
    
    if intent['search_query']:
        params.append(f"query={intent['search_query']}")
    
    deep_link = f"{base_url}?{'&'.join(params)}"
    
    location_name = "Banorte" if intent['location_type'] == "bank" else "oficinas del SAT"
    message = f"📍 ¡Claro! Te abro el mapa con los {location_name} más cercanos."
    
    if intent['search_query']:
        message = f"📍 Busco {location_name} en {intent['search_query']} para ti."
    
    import json
    return json.dumps({
        'text': message,
        'deep_link': deep_link,
        'tool_used': 'open_map_location',
        'details': intent
    }, ensure_ascii=False)
```

Esta opción es más simple pero duplica un poco la lógica. La primera opción con función auxiliar es mejor para mantener el código DRY (Don't Repeat Yourself).
