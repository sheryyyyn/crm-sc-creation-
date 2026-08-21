// Calcule le nombre de jours restants avant la deadline d'un projet (timeline.fin)
// et renvoie un libellé compact ("J-5", "J-0", "Retard 3j") + une couleur d'alerte.
export function getJoursRestants(dateFin) {
  if (!dateFin) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fin = new Date(dateFin)
  fin.setHours(0, 0, 0, 0)
  const diff = Math.round((fin - today) / 86400000)

  if (diff < 0) return { diff, label: `Retard ${Math.abs(diff)}j`, color: '#ef4444', bg: '#fee2e2' }
  if (diff === 0) return { diff, label: 'J-0 · aujourd\'hui', color: '#ef4444', bg: '#fee2e2' }
  if (diff <= 3) return { diff, label: `J-${diff}`, color: '#a1402d', bg: '#f5e6e3' }
  if (diff <= 7) return { diff, label: `J-${diff}`, color: '#b8860b', bg: '#fdf4dc' }
  return { diff, label: `J-${diff}`, color: '#241512', bg: '#f5f4f1' }
}
