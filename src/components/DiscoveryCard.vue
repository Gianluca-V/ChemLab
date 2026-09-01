<script setup>
/**
 * Tarjeta de la grilla de Descubrimientos — frame 17, SPEC 12 §4
 *
 * Dos variantes por la presencia de `compound`:
 *   · Descubierta: navega a /compound/:formula, que registra historial
 *     (SPEC 11 §1). Muestra `formula`, no `key` (SPEC 02 §2.1).
 *   · Bloqueada: NO es interactiva. No revela nombre, fórmula ni elementos,
 *     solo la pista de átomos totales — no tipos de elemento (SPEC 12 §4).
 */
import ChemFormula from './ChemFormula.vue';

defineProps({
  /** Compuesto ya descubierto, o null para la variante bloqueada. */
  compound: { type: Object, default: null },
  /** Átomos totales de la composición. Solo se usa cuando compound es null. */
  hint: { type: Number, default: 0 },
});
</script>

<template>
  <RouterLink
    v-if="compound"
    class="card card--found"
    :to="{ name: 'compound', params: { formula: compound.formula } }"
  >
    <p class="card__formula">
      <ChemFormula :formula="compound.formula" :name="compound.name" />
    </p>
    <p class="card__name">{{ compound.name }}</p>
  </RouterLink>

  <div v-else class="card card--locked" :aria-label="`Compuesto sin descubrir, ${hint} átomos`">
    <p class="card__formula" aria-hidden="true">? ? ?</p>
    <p class="card__name mono">{{ hint }} átomos</p>
  </div>
</template>

<style scoped>
.card {
  display: block;
  padding: var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  text-align: left;
}

.card__formula {
  color: var(--text-1);
  font-size: var(--fs-4);
}

.card__name {
  margin-top: var(--sp-1);
  overflow: hidden;
  color: var(--text-3);
  font-size: var(--fs-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card--found {
  background: var(--surface-2);
  transition: transform var(--dur-fast) var(--ease);
}

.card--found:hover {
  transform: translateY(-1px);
  text-decoration: none;
}

.card--locked {
  background: var(--surface-1);
  border-style: dashed;
}

.card--locked .card__formula {
  color: var(--mark-off);
}
</style>
