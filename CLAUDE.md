# Control de Cheques Personales — Reglas del Proyecto

Este documento define las reglas generales que deben seguirse **siempre** al trabajar en este repositorio. Cualquier código, migración o cambio de configuración debe respetar estos lineamientos.

## 1. Visión del proyecto

Aplicación web para llevar el control de cheques personales (emitidos y recibidos): registro, estado (pendiente, cobrado, depositado, anulado, rechazado/devuelto), fechas, montos, banco, beneficiario/emisor y notas.

Objetivos no negociables:
- **Mantenible**: código claro, modular, fácil de extender sin reescribir.
- **Escalable**: la arquitectura debe soportar crecimiento (más usuarios, más datos, más funcionalidades) sin rediseño mayor.
- **Segura**: los datos financieros del usuario están protegidos en cada capa (base de datos, API, cliente).
- **Diseño moderno**: interfaz limpia, responsiva, accesible.

## 2. Stack tecnológico

- **Frontend/Backend**: Next.js (App Router) + TypeScript.
- **Base de datos/Auth**: Supabase (Postgres + Auth + Row Level Security).
- **Hosting**: Vercel.
- **Estilos**: Tailwind CSS.
- **Validación**: Zod (o similar) en todos los límites de entrada (formularios, API routes).

No introducir librerías o servicios adicionales sin justificarlo explícitamente — evitar dependencias innecesarias.

## 3. Seguridad (regla más importante)

- **Row Level Security (RLS) obligatorio** en todas las tablas con datos de usuario. Ninguna tabla se crea sin políticas RLS activas desde el primer momento.
- Cada usuario solo puede leer/escribir **sus propios** cheques. Nunca se filtra por `user_id` solo en el cliente — el filtro real vive en las políticas RLS.
- La **service role key** de Supabase nunca se usa en código que corra en el navegador ni se expone en variables `NEXT_PUBLIC_*`. Solo se usa en contexto servidor (API routes / server actions) cuando sea estrictamente necesario.
- Toda entrada de usuario se valida y sanitiza en el servidor, no solo en el cliente (el cliente valida por UX, el servidor valida por seguridad).
- Nunca comitear secretos, tokens o claves. Usar variables de entorno (`.env.local`, Vercel Environment Variables) y mantener `.env*` en `.gitignore`.
- Autenticación vía Supabase Auth; ninguna ruta que muestre o modifique cheques queda accesible sin sesión válida.
- Registrar (log) solo lo necesario; nunca loguear montos, números de cheque completos u otra data sensible en texto plano en logs persistentes.

## 4. Buenas prácticas de programación

- TypeScript en modo `strict`. Prohibido `any` salvo justificación explícita en comentario.
- Funciones y componentes pequeños, con una sola responsabilidad. Si un archivo crece demasiado, dividir.
- Nombres descriptivos en inglés para código (variables, funciones, tablas, columnas) — el dominio de negocio ("cheque", "beneficiario") puede mantenerse en español donde sea el término natural del producto.
- No dejar código muerto, comentado o `console.log` de depuración en commits.
- Comentarios solo cuando expliquen el **por qué**, no el qué (el código ya dice el qué).
- Sin abstracciones prematuras: no crear capas genéricas para casos hipotéticos futuros.
- Manejo de errores explícito en operaciones de base de datos y llamadas externas; nunca silenciar errores.
- Migraciones de base de datos versionadas (una migración por cambio de esquema), nunca editar el esquema a mano en producción.

## 5. Diseño / UI

- Diseño moderno, minimalista, con jerarquía visual clara (tipografía, espaciado, color).
- Responsivo: debe verse bien en móvil y escritorio.
- Accesible: contraste adecuado, foco visible, labels en formularios, soporte de teclado.
- Modo claro y oscuro cuando sea razonable implementarlo sin sobrecomplicar.
- Estados de carga, vacío y error siempre diseñados explícitamente (nunca pantallas en blanco).

## 6. Flujo de trabajo Git

- Rama de desarrollo actual: `claude/hola-laha5n`.
- Commits pequeños y descriptivos, en español o inglés consistente por commit, explicando el "por qué" del cambio.
- No hacer force-push ni reescribir historial compartido sin autorización explícita.
- No crear Pull Request salvo que el usuario lo pida explícitamente.

## 7. Antes de escribir código

- No implementar funcionalidad más allá de lo pedido en cada paso.
- Confirmar con el usuario decisiones de alcance ambiguas (qué campos lleva un cheque, qué estados existen, si hay multi-moneda, etc.) antes de modelar el esquema definitivo.
- Verificar el estado de Supabase (`list_tables`) antes de aplicar cualquier migración nueva.
