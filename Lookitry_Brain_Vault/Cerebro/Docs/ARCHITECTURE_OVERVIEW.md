# Arquitectura de Documentación: Lookitry

Este es el mapa maestro del conocimiento del proyecto. Todos los documentos deben mantenerse sincronizados siguiendo las reglas de la **Documentación Viva**.

---

## 1. Capa de Negocio y Producto (Founders & PMs)
- **[[PITCH_ONE_PAGER]]**: Narrativa para inversionistas y programas de aceleración.
- **[[PRD]]**: Requerimientos de producto, historias de usuario y visión estratégica.
- **[[GUIA_USUARIO_MARCA]]**: Manual de onboarding para dueños de tiendas (No-Técnico).

## 2. Capa de Ejecución y Diseño (UX/UI & Frontend)
- **[[DESIGN]]**: Sistema de diseño, paleta de colores, tipografía y catálogo de componentes.
- **[[WIDGET_GUIDE]]**: Guía de integración y comportamiento del probador virtual.

## 3. Capa Técnica e Infraestructura (CTO & Devs)
- **[[TECH_STACK]]**: Pila tecnológica, arquitectura de servicios y pipeline de IA.
- **[[Esquema_Base_Datos]]**: Definición de tablas, relaciones y vectores (pgvector).
- **[[REGLAS_IMPORTANTES]]**: Protocolos operativos y blindaje de ingeniería.

---

## Bucle de Sincronización
- **Trigger**: Cualquier cambio en la base de datos o API debe reflejarse en `Esquema_Base_Datos.md`.
- **Trigger**: Cualquier cambio en los planes o costos debe actualizar el `PITCH_ONE_PAGER.md`.
- **Trigger**: Los nuevos hitos técnicos deben registrarse en el `CHANGELOG.md`.

*Lookitry - IA Try-On para Latinoamérica*
