<script setup>
/**
 * 404 — SPEC 01 §2
 *
 * Ningún frame del documento de diseño la dibuja. Se implementa reutilizando
 * EmptyState con el encabezado y el drawer estándar: no se inventa una pantalla
 * nueva.
 */
import EmptyState from '../components/EmptyState.vue';
</script>

<template>
  <EmptyState
    icon="🧭"
    title="Esta página no existe"
    description="La dirección que abriste no corresponde a ninguna sección de ChemLab."
  >
    <template #action>
      <RouterLink :to="{ name: 'home' }" class="btn btn--primary">Volver al inicio</RouterLink>
    </template>
  </EmptyState>
</template>
