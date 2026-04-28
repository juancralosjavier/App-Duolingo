export const XP_PER_LEVEL = 120;

export function getLevelFromXp(xp: number) {
  return Math.floor((xp || 0) / XP_PER_LEVEL) + 1;
}

export function getLevelProgress(xp: number) {
  return (xp || 0) % XP_PER_LEVEL;
}

export function getStarsFromAccuracy(accuracy: number) {
  if (accuracy >= 90) return 3;
  if (accuracy >= 75) return 2;
  if (accuracy >= 60) return 1;
  return 0;
}

export function getPhaseLabel(level: number) {
  if (level <= 2) return "Fase 1 · Semillero";
  if (level <= 4) return "Fase 2 · Mercado";
  if (level <= 6) return "Fase 3 · Ruta";
  if (level <= 8) return "Fase 4 · Maestría";
  return "Fase 5 · Liga Camba";
}

export function getDifficultyLabel(difficulty: number) {
  if (difficulty <= 1) return "Básico";
  if (difficulty === 2) return "Intermedio";
  if (difficulty === 3) return "Avanzado";
  return "Experto";
}

export function getChallengeTypeLabel(type?: string) {
  switch (type) {
    case "multiple_choice":
      return "Selección";
    case "numeric_input":
      return "Respuesta numérica";
    case "true_false":
      return "Verdadero/Falso";
    case "sequence_choice":
      return "Secuencia";
    case "speed":
      return "Velocidad";
    case "logic":
      return "Lógica";
    default:
      return "Mixto";
  }
}
