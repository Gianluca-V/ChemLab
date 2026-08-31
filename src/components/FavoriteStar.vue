<script setup>
/**
 * Estrella de favorito — SPEC 06 §4
 *
 * En el TopBar de AMBAS vistas de detalle, 44×44 px. El frame 06 no la incluía
 * y en los 28 frames no existe el estado de estrella llena: se especifica acá,
 * junto con el toast de confirmación que se dispara al guardar. Sin ambos, el
 * usuario no tiene forma de saber si la acción tuvo efecto.
 *
 * El color NO es el único portador del estado: el contorno y el relleno difieren
 * en forma, y el aria-label enuncia el estado en palabras.
 *
 * El estado se lee de useFavorites(), que es reactivo: marcar un favorito desde
 * el diálogo actualiza la estrella sin que la vista intervenga.
 */
import { computed, ref } from 'vue';
import { useFavorites } from '../composables/useFavorites.js';
import { useToast } from '../composables/useToast.js';
import FavoriteDialog from './FavoriteDialog.vue';

const props = defineProps({
  /** `symbol` para elementos, `formula` para compuestos. */
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    validator: (value) => ['element', 'compound'].includes(value),
  },
  name: { type: String, required: true },
  formula: { type: String, default: null },
});

const favorites = useFavorites();
const toast = useToast();

const dialogOpen = ref(false);

const existing = computed(() => favorites.find(props.id, props.type));

const label = computed(() =>
  existing.value
    ? `Editar tu favorito ${props.name}, ${existing.value.rating} de 5 estrellas`
    : `Añadir ${props.name} a favoritos`
);

/** @param {{rating: number, note: string}} payload */
function save({ rating, note }) {
  favorites.save({
    id: props.id,
    type: props.type,
    name: props.name,
    formula: props.formula,
    rating,
    note,
  });
  dialogOpen.value = false;

  toast.show({
    type: 'favorite-save',
    title: 'Guardado en favoritos',
    detail: `${props.name} · ${rating} de 5 estrellas`,
  });
}

/**
 * La eliminación pasa por ConfirmSheet en FavoritesView (SPEC 15 §3), donde la
 * hoja puede cubrir la lista sobre la que actúa. Desde el detalle se elimina
 * directo y sin ofrecer deshacer, para no contradecir esa advertencia.
 */
function remove() {
  favorites.remove(props.id, props.type);
  dialogOpen.value = false;
  toast.show({ type: 'favorite-delete', title: 'Favorito eliminado', detail: props.name });
}
</script>

<template>
  <button
    type="button"
    class="star"
    :class="{ 'star--on': existing !== null }"
    :aria-label="label"
    @click="dialogOpen = true"
  >
    <span aria-hidden="true">{{ existing ? '★' : '☆' }}</span>
  </button>

  <FavoriteDialog
    :open="dialogOpen"
    :item-name="name"
    :existing="existing"
    @save="save"
    @delete="remove"
    @close="dialogOpen = false"
  />
</template>

<style scoped>
.star {
  flex: none;
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border-radius: var(--r-md);
  color: var(--mark-off);
  font-size: var(--fs-5);
  line-height: 1;
}

.star:hover {
  background: var(--surface-3);
}

.star--on {
  color: var(--star-on);
}
</style>
