<script setup>
/**
 * Contacto — frame 18
 *
 * PENDIENTE: esta vista se especifica en SPEC 13 §B, fuera del alcance de la
 * entrega actual (SPECs 00–09). El composable que la alimenta —ninguno: la vista no tiene estado—
 * ya está implementado y persistiendo, así que la vista es lo único que falta.
 *
 * La ruta existe desde ahora porque SPEC 01 §2 fija las 12 rutas más el
 * catch-all, y porque el badge del drawer y de la sidebar ya enlaza acá.
 */
import EmptyState from '../components/EmptyState.vue';
</script>

<template>
  <div>
    <EmptyState
      icon="✉"
      title="Todavía no implementamos esta sección"
      description="Los datos de contacto y el mapa se especifican en la SPEC 13."
    >
      <template #action>
        <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">
          Abrir tabla periódica
        </RouterLink>
      </template>
    </EmptyState>
  </div>
</template>
