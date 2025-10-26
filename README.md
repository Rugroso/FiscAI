<div align="center">
  <img src="./assets/images/icon.png" alt="FiscAI Logo" width="120" />
  <h1>FiscAI</h1>
  <p>Asistente fiscal inteligente para pequeños negocios y emprendedores</p>
</div>

---

## Descripción

FiscAI es una aplicación móvil multiplataforma desarrollada con Expo y React Native, diseñada para ayudar a pequeños negocios y emprendedores a gestionar su situación fiscal, obtener recomendaciones personalizadas, visualizar su progreso y acceder a herramientas inteligentes como chat asistido, roadmap fiscal, análisis financiero y más.

## Tabla de Contenidos

- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Base de Datos y Supabase](#base-de-datos-y-supabase)
- [Créditos](#créditos)

---

## Instalación

1. Clona el repositorio y entra al directorio:
   ```bash
   git clone https://github.com/Rugroso/FiscAI.git
   cd FiscAI
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno en un archivo `.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=TU_URL_SUPABASE
   EXPO_PUBLIC_SUPABASE_KEY=TU_KEY_SUPABASE
   EXPO_PUBLIC_API_BASE_URL=TU_API_URL
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY
   ```
4. Inicia la app:
   ```bash
   npx expo start
   ```

## Uso

Puedes abrir la app en un emulador Android/iOS, dispositivo físico con Expo Go, o en la web. Sigue las instrucciones que aparecen en la terminal tras ejecutar el comando de inicio.

## Estructura del Proyecto

```
FiscAI/
├── app/                # Pantallas y rutas principales (file-based routing)
│   ├── _layout.tsx     # Layout global, providers de contexto
│   ├── login.tsx       # Pantalla de inicio de sesión
│   ├── register.tsx    # Registro de usuario
│   ├── cuestionario.tsx# Cuestionario inicial de negocio
│   ├── (drawer)/       # Navegación principal tipo Drawer
│   │   └── (tabs)/     # Navegación por pestañas (Home, Chat, Mapa, etc.)
│   │       ├── stackhome/   # Home, Roadmap, Beneficios, Recomendaciones
│   │       ├── stackchat/   # Chatbot fiscal
│   │       └── stackmap/    # Mapa de bancos y SAT
├── components/         # Componentes reutilizables (UI, gráficos, etc.)
├── context/            # Contextos globales (Auth, Progreso)
├── services/           # Lógica de negocio (ej. chat, API)
├── constants/          # Temas y constantes globales
├── config/             # Configuración de API y Supabase
├── assets/             # Imágenes y recursos estáticos
├── scripts/            # Scripts utilitarios
├── package.json        # Dependencias y scripts de npm
├── app.json            # Configuración de Expo
└── README.md           # Este archivo
```

### Desglose de Carpetas y Archivos Clave

- **app/**: Contiene todas las pantallas y rutas. Usa Expo Router para navegación basada en archivos.
- **components/**: Elementos visuales reutilizables (ej. `growthpotential.tsx`, `roadmap.tsx`, `ui/`).
- **context/**: Proveedores de contexto global para autenticación y progreso del usuario.
- **services/**: Lógica de negocio, como el servicio de chat conectado a Supabase.
- **supabase/**: Migraciones SQL para la base de datos (conversaciones, negocios, etc.).
- **config/**: Configuración centralizada de APIs y claves.
- **constants/**: Temas de color y constantes globales.

## Tecnologías Utilizadas

- **React Native** (Expo)
- **TypeScript**
- **Expo Router**
- **Supabase** (autenticación, base de datos, realtime)
- **React Navigation**
- **AsyncStorage**
- **Google Maps API**
- **Expo Modules**: Haptics, Image Picker, Location, etc.

## Funcionalidades Principales

- **Autenticación de usuarios** (registro, login, persistencia de sesión)
- **Cuestionario inicial** para personalizar la experiencia según el negocio
- **Roadmap fiscal**: guía paso a paso para cumplir obligaciones fiscales
- **Chatbot fiscal**: asistente inteligente conectado a Supabase
- **Análisis de potencial de crecimiento** y recomendaciones financieras
- **Mapa interactivo** de bancos y oficinas SAT cercanas
- **Gestión de progreso** y desbloqueo de etapas
- **Beneficios y recursos** para el usuario

## Base de Datos y Supabase

El backend utiliza Supabase para autenticación y almacenamiento de datos. Las migraciones SQL se encuentran en `supabase/migrations/` e incluyen:

- `001_chat_schema.sql`: Tablas para conversaciones y mensajes del chat
- `002_businesses_schema.sql`: Información de negocios, métricas y formalidad

## Créditos

Desarrollado por [Rugroso](https://github.com/Rugroso) y colaboradores.

---
<div align="center">
  <sub>© 2025 FiscAI. Todos los derechos reservados.</sub>
</div>

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
