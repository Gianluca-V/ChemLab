<script setup>
/**
 * Descubrimientos — frame 17
 *
 * PENDIENTE: esta vista se especifica en SPEC 12, fuera del alcance de la
 * entrega actual (SPECs 00–09). El composable que la alimenta —useDiscoveries()—
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
      icon="🎉"
      title="Todavía no implementamos esta sección"
      description="Tus descubrimientos se registran al combinar; la pantalla que los lista se especifica en la SPEC 12."
    >
      <template #action>
        <RouterLink :to="{ name: 'lab' }" class="btn btn--primary">
          Abrir tabla periódica
        </RouterLink>
      </template>
    </EmptyState>
  </div>
</template>
