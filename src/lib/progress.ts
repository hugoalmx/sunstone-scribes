// src/lib/progress.ts
export type ProgressValue = 0 | 50 | 75 | 100

export function progressLabel(p?: number) {
  switch (p) {
    case 0:   return 'Em aberto'
    case 25: return 'Iniciado'
    case 50:  return 'Em progresso'
    case 75:  return 'Finalizando'
    case 100: return 'Concluído'
    default:  return 'Em aberto'
  }
}

export function progressColorClass(p?: number) {
  switch (p) {
    case 0:   return 'bg-white dark:bg-white'
    case 25:  return 'bg-red-400'       // visível no dark
    case 50:  return 'bg-yellow-400'
    case 75:  return 'bg-orange-400'
    case 100: return 'bg-emerald-500'
    default:  return 'bg-white dark:bg-white'
  }
}
