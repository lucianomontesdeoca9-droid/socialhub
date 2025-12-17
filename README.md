# socialhub
Una Web Inspirada en la Red Social X (Todavía es Demo)

# 🌐 SocialHub - Tu Red Social

Una red social moderna e interactiva inspirada en X (Twitter), desarrollada completamente con JavaScript vanilla, HTML5 y CSS3. Sin backend, toda la funcionalidad se ejecuta del lado del cliente utilizando localStorage.


## ✨ Características Principales

### 📝 Publicaciones
- **Crear posts** con texto enriquecido (hasta 500 caracteres)
- **Múltiples imágenes** por publicación
- **Videos** y contenido multimedia
- **Encuestas** interactivas con votación en tiempo real
- **Emojis** integrados
- **Hashtags** y menciones automáticas
- **Borradores** y posts programados

### 💬 Interacción Social
- **Sistema de likes** con contadores en tiempo real
- **Comentarios** anidados con respuestas
- **Compartir posts** (repost)
- **Guardar publicaciones** favoritas
- **Seguir usuarios** y ver su contenido
- **Notificaciones** en tiempo real
- **Mensajería directa** entre usuarios

### 🎨 Experiencia de Usuario
- **Interfaz moderna** inspirada en X/Twitter
- **Diseño responsive** adaptado a todos los dispositivos
- **Búsqueda avanzada** con filtros
- **Ordenamiento** por fecha (recientes/antiguos)
- **Filtros por tipo** (todos, con imágenes, con videos, encuestas)
- **Estadísticas detalladas** de actividad
- **Modo claro** optimizado
- **Animaciones fluidas** y transiciones suaves

### 👤 Gestión de Perfil
- **Personalización** de avatar y nombre
- **Foto de perfil** personalizable
- **Estadísticas** de posts, likes y comentarios
- **Historial** de actividad
- **Seguimiento** de usuarios

### 💾 Persistencia de Datos
- **LocalStorage** para almacenamiento permanente
- **Datos persistentes** entre sesiones
- **Importar/Exportar** datos en JSON
- **Sin necesidad de servidor**

## 🚀 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere Node.js, npm ni ningún servidor

### Inicio Rápido

1. **Clona el repositorio**
```bash
git clone https://github.com/tuusuario/socialhub.git
cd socialhub
```

2. **Abre el proyecto**
   - Opción 1: Haz doble clic en `index.html`
   - Opción 2: Usa Live Server en VS Code
   - Opción 3: Abre con un servidor local simple:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve
   ```

3. **Accede a la aplicación**
   - Abre tu navegador en `http://localhost:8000` (si usas servidor)
   - O directamente desde el archivo HTML

## 📁 Estructura del Proyecto

```
socialhub/
│
├── index.html          # Página principal con toda la estructura
├── styles.css          # Estilos completos y responsive
├── script.js           # Lógica de la aplicación
├── README.md           # Este archivo
```

## 🎯 Funcionalidades Detalladas

### 1. Sistema de Posts
- Crear publicaciones con texto, imágenes y videos
- Límite de 280 caracteres con contador visual
- Vista previa de imágenes antes de publicar
- Subir múltiples imágenes (hasta 4)
- Borradores automáticos
- Programar publicaciones futuras

### 2. Sistema de Encuestas
- Crear encuestas con múltiples opciones
- Visualización de resultados en tiempo real
- Barra de progreso por opción
- Conteo de votos total
- Opción de voto único por usuario

### 3. Interacción Social
- **Likes**: Da "me gusta" a cualquier publicación
- **Comentarios**: Sistema de comentarios anidados
- **Guardar**: Marca posts favoritos para después
- **Compartir**: Repostea contenido de otros usuarios
- **Seguir**: Sigue a usuarios y ve su contenido

### 4. Mensajería
- Conversaciones privadas entre usuarios
- Indicador de "escribiendo..."
- Historial de mensajes
- Notificaciones de nuevos mensajes
- Lista de usuarios disponibles

### 5. Notificaciones
- Notificaciones en tiempo real
- Badge con contador
- Panel deslizable
- Tipos: likes, comentarios, seguimientos, mensajes
- Marcar como leídas
- Borrar notificaciones

### 6. Búsqueda y Filtros
- Búsqueda por texto en tiempo real
- Filtrar por tipo de contenido:
  - Todos los posts
  - Solo con imágenes
  - Solo con videos
  - Solo encuestas
- Ordenar por fecha (recientes/antiguos)

### 7. Estadísticas
- Total de publicaciones
- Total de likes recibidos
- Total de comentarios
- Actividad por día
- Gráficos visuales
- Usuarios más activos

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: 
  - Variables CSS para temas
  - Flexbox y Grid Layout
  - Animaciones y transiciones
  - Media queries para responsive
- **JavaScript (ES6+)**:
  - Vanilla JS puro (sin frameworks)
  - LocalStorage API
  - FileReader API para imágenes
  - Date API para fechas
  - Array methods modernos

## 💡 Características Técnicas

### Almacenamiento
- **LocalStorage** para persistencia de datos
- Estructura de datos JSON
- Compresión de imágenes en Base64
- Límite: ~5-10MB (dependiendo del navegador)

### Responsive Design
- Mobile First approach
- Breakpoints: 768px, 1024px, 1440px
- Touch-friendly en dispositivos móviles
- Hamburger menu para móviles

### Accesibilidad
- Etiquetas ARIA
- Skip links
- Alto contraste
- Navegación por teclado
- Semántica HTML5

### Rendimiento
- Lazy loading de imágenes
- Debounce en búsqueda
- Throttle en scroll
- Optimización de re-renders

## 🎨 Personalización

### Cambiar Colores
Edita las variables CSS en `styles.css`:
```css
:root {
    --accent: #1d9bf0;        /* Color principal */
    --danger: #f4212e;        /* Color de peligro */
    --success: #00ba7c;       /* Color de éxito */
}
```

### Ajustar Límites
Modifica las constantes en `script.js`:
```javascript
const MAX_CHARACTERS = 280;    // Límite de caracteres
const MAX_IMAGES = 4;          // Máximo de imágenes
const MAX_POLL_OPTIONS = 5;   // Opciones de encuesta
```

## 🐛 Solución de Problemas

### Los datos no se guardan
- Verifica que las cookies estén habilitadas
- Comprueba el espacio disponible en localStorage
- Revisa la consola del navegador para errores

### Las imágenes no se cargan
- Asegúrate de usar formatos soportados (JPG, PNG, GIF, WebP)
- Verifica el tamaño de las imágenes (recomendado < 2MB)
- Comprueba el límite de localStorage

### La aplicación está lenta
- Limpia los datos antiguos
- Reduce el número de posts guardados
- Borra el caché del navegador

## 📱 Compatibilidad

| Navegador | Versión Mínima | Soporte |
|-----------|----------------|---------|
| Chrome    | 90+            | ✅ Completo |
| Firefox   | 88+            | ✅ Completo |
| Safari    | 14+            | ✅ Completo |
| Edge      | 90+            | ✅ Completo |
| Opera     | 76+            | ✅ Completo |

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Sistema de hashtags con trending topics
- [ ] Menciones con autocompletado
- [ ] Modo oscuro completo
- [ ] Compartir en redes sociales
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Verificación de usuarios
- [ ] Sistema de badges/logros
- [ ] Exportar posts a PDF
- [ ] Integración con APIs externas


## Autor

**Luciano Montes De Oca**

- GitHub: [@lucianomontesdeoca9-droid](https://github.com/lucianomontesdeoca9-droid)
- Email: lucianomontesdeoca9@gmail.com
- Visita la Web: https://lucianomontesdeoca9-droid.github.io/socialhub/

## Agradecimientos

- Inspirado en X (Twitter)
- Iconos SVG personalizados
- Comunidad de desarrolladores


⭐ Si te gusta este proyecto, dale una estrella en GitHub!

🔗 [Demo en vivo](https://tuusuario.github.io/socialhub)
