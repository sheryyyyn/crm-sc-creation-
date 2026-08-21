import { useState } from 'react'
import { Plus, FileText, Receipt, BookOpen, Trash2, Printer, ClipboardList } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

// ─── Auto-numérotation ────────────────────────────────────────────────────────
function generateNumero(type, documents) {
  const year = new Date().getFullYear()
  const prefix = type === 'devis' ? 'DEV' : type === 'contrat' ? 'CTR' : 'FAC'
  const count = documents.filter(d => d.type === type && String(d.numero).includes(String(year))).length + 1
  return `${prefix}-${year}-${String(count).padStart(3, '0')}`
}

// ─── Templates pré-remplis ────────────────────────────────────────────────────
const TEMPLATES = {
  devis: {
    lignes: [
      { description: 'Identité visuelle & direction artistique', detail: 'Harmonisation de la charte graphique existante pour le web — couleurs, typographies, univers de marque', quantite: 1, prixUnitaire: 0 },
      { description: 'Design UX — Architecture & parcours utilisateur', detail: 'Définition stratégique de la structure du site et du parcours d\'achat — hiérarchie des pages, placement des éléments clés, séquence de lecture pensée pour guider le visiteur naturellement vers l\'achat', quantite: 1, prixUnitaire: 0 },
      { description: 'Design UI — Maquettes V1', detail: 'Création des maquettes visuelles desktop & mobile — mise en page, typographies, couleurs, univers de marque — soumises à validation avant intégration', quantite: 1, prixUnitaire: 0 },
      { description: 'Intégration & développement Shopify', detail: 'Développement du site, intégration des produits, système de commande et paiement en ligne', quantite: 1, prixUnitaire: 0 },
      { description: 'Intégration newsletter', detail: 'Mise en place de la newsletter — collecte d\'emails et communication autour des drops', quantite: 1, prixUnitaire: 0 },
      { description: 'Intégration multilingue', detail: 'Déclinaison du site en plusieurs langues pour toucher les femmes des îles au-delà des frontières', quantite: 1, prixUnitaire: 0 },
      { description: 'Optimisation SEO on-page', detail: 'Optimisation du référencement naturel pour maximiser la visibilité du site sur les moteurs de recherche', quantite: 1, prixUnitaire: 0 },
      { description: 'Révisions & ajustements', detail: 'Retouches et ajustements inclus à chaque étape du projet — maquettes, intégration et contenus — pour un résultat final en accord avec votre vision.', quantite: 1, prixUnitaire: 0 },
      { description: 'Suivi & accompagnement post-mise en ligne', detail: '1 mois d\'accompagnement inclus après la livraison — corrections, ajustements, support à la prise en main et mises à jour. Au-delà, une offre de maintenance mensuelle peut être proposée.', quantite: 1, prixUnitaire: 0 },
    ],
    objet: '',
    delai: '3 à 4 semaines',
    acompte: 50,
  },
  facture: {
    lignes: [
      { description: 'Prestation web design', detail: '', quantite: 1, prixUnitaire: 0 },
    ],
  },
  contrat: {
    lignes: [],
    objet: '',
    delai: '',
    acompte: 50,
  },
}

function makeEmptyDoc(type, documents) {
  return {
    type,
    clientId: '',
    numero: generateNumero(type, documents),
    statut: 'en_attente',
    montantHT: 0,
    tva: 0,
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    notes: '',
    objet: TEMPLATES[type].objet ?? '',
    delai: TEMPLATES[type].delai ?? '',
    acompte: TEMPLATES[type].acompte ?? 50,
    lignes: TEMPLATES[type].lignes.map(l => ({ ...l })),
  }
}

// ─── Aperçu Devis ─────────────────────────────────────────────────────────────
function DocumentPreview({ doc, client }) {
  const tva = doc.tva || 0
  const montantTVA = (doc.montantHT || 0) * tva / 100
  const montantTTC = (doc.montantHT || 0) + montantTVA
  const acompte = doc.acompte ?? 50
  const acompteHT = (doc.montantHT || 0) * acompte / 100
  const soldeHT = (doc.montantHT || 0) - acompteHT

  const dateEmission = doc.dateEmission ? new Date(doc.dateEmission) : new Date()
  const dateValidite = new Date(dateEmission)
  dateValidite.setDate(dateValidite.getDate() + 30)
  const fmt = (d) => d.toLocaleDateString('fr-FR')
  const fmtEur = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (doc.type === 'facture') {
    return (
      <div className="bg-white p-8 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }} id="doc-preview">
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#241512' }}>SC Création</h1>
            <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>Agence Web Design</p>
            <p className="text-xs" style={{ color: '#a89b8c' }}>contact@sc-creation.fr</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold uppercase" style={{ color: '#241512' }}>Facture</p>
            <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>N° {doc.numero}</p>
            <p className="text-xs" style={{ color: '#a89b8c' }}>Émis le {fmt(dateEmission)}</p>
          </div>
        </div>
        {client && (
          <div className="mb-8 p-4 rounded-lg" style={{ background: '#f5f4f1' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#a89b8c' }}>DESTINATAIRE</p>
            <p className="font-semibold" style={{ color: '#241512' }}>{client.nom}</p>
            {client.email && <p className="text-sm" style={{ color: '#a89b8c' }}>{client.email}</p>}
          </div>
        )}
        <table className="w-full mb-6">
          <thead>
            <tr style={{ borderBottom: '2px solid #e7e5e1' }}>
              <th className="text-xs font-semibold text-left pb-2" style={{ color: '#a89b8c' }}>Description</th>
              <th className="text-xs font-semibold text-right pb-2 w-16" style={{ color: '#a89b8c' }}>Qté</th>
              <th className="text-xs font-semibold text-right pb-2 w-24" style={{ color: '#a89b8c' }}>P.U HT</th>
              <th className="text-xs font-semibold text-right pb-2 w-24" style={{ color: '#a89b8c' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lignes || []).map((l, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eeece7' }}>
                <td className="py-2" style={{ color: '#241512' }}>{l.description}</td>
                <td className="py-2 text-right" style={{ color: '#a89b8c' }}>{l.quantite}</td>
                <td className="py-2 text-right" style={{ color: '#a89b8c' }}>{(l.prixUnitaire || 0).toLocaleString('fr-FR')} €</td>
                <td className="py-2 text-right font-medium" style={{ color: '#241512' }}>{((l.quantite || 0) * (l.prixUnitaire || 0)).toLocaleString('fr-FR')} €</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between"><span style={{ color: '#a89b8c' }}>Total HT</span><span className="font-medium">{fmtEur(doc.montantHT || 0)} €</span></div>
            <div className="flex justify-between"><span style={{ color: '#a89b8c' }}>TVA ({tva}%)</span><span className="font-medium">{fmtEur(montantTVA)} €</span></div>
            <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid #e7e5e1' }}><span>Total TTC</span><span style={{ color: '#241512' }}>{fmtEur(montantTTC)} €</span></div>
          </div>
        </div>
        {doc.notes && <div className="mt-6 p-3 rounded text-xs" style={{ background: '#f5f4f1', color: '#a89b8c' }}><span className="font-semibold">Notes : </span>{doc.notes}</div>}
        <div className="mt-8 pt-4 text-xs text-center" style={{ borderTop: '1px solid #eeece7', color: '#a89b8c' }}>SC Création — Merci pour votre confiance</div>
      </div>
    )
  }

  // ── Devis ──
  return (
    <div className="bg-white p-8 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }} id="doc-preview">
      {/* Logo */}
      <div className="text-center mb-5">
        <h1 className="text-3xl font-black tracking-widest uppercase" style={{ letterSpacing: '0.18em', color: '#241512' }}>SC CRÉATION</h1>
        <div className="w-full h-px mt-4" style={{ background: '#e7e5e1' }} />
      </div>

      {/* Titre DEVIS */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-widest" style={{ color: '#241512' }}>DEVIS</h2>
        <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>
          N° {doc.numero} • Émis le : {fmt(dateEmission)} • Valable jusqu'au : {fmt(dateValidite)}
        </p>
      </div>

      {/* Prestataire / Client */}
      <div className="grid grid-cols-2 mb-6" style={{ border: '1px solid #e7e5e1' }}>
        <div className="p-4" style={{ borderRight: '1px solid #e7e5e1' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#a89b8c' }}>PRESTATAIRE</p>
          <p className="font-bold" style={{ color: '#241512' }}>SC CRÉATION</p>
          <p className="text-xs" style={{ color: '#241512' }}>Sheryn Ait Tabet & Chaïnez Raho</p>
          <p className="text-xs" style={{ color: '#241512' }}>47 rue Vivienne, 75002 Paris</p>
          <p className="text-xs" style={{ color: '#a89b8c' }}>Société en cours de création (SAS)</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#a89b8c' }}>CLIENT</p>
          <p className="font-bold" style={{ color: '#241512' }}>{client?.nom || '—'}</p>
          {client?.email && <p className="text-xs" style={{ color: '#241512' }}>{client.email}</p>}
          {client?.telephone && <p className="text-xs" style={{ color: '#a89b8c' }}>{client.telephone}</p>}
        </div>
      </div>

      {/* Objet */}
      {doc.objet && (
        <div className="mb-6">
          <p className="font-bold text-xs pb-1 mb-2 uppercase tracking-wider" style={{ color: '#241512', borderBottom: '1px solid #e7e5e1' }}>OBJET DE LA PRESTATION</p>
          <p className="text-xs leading-relaxed" style={{ color: '#241512' }}>{doc.objet}</p>
          {doc.delai && <p className="text-xs mt-1 italic" style={{ color: '#a89b8c' }}>Délai de livraison estimé : {doc.delai} à compter de la réception de l'acompte et de la validation du brief.</p>}
        </div>
      )}

      {/* Prestations */}
      <div className="mb-6">
        <p className="font-bold text-xs pb-1 mb-0 uppercase tracking-wider" style={{ color: '#241512', borderBottom: '1px solid #e7e5e1' }}>DÉTAIL DES PRESTATIONS</p>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#241512' }}>
              <th className="text-left px-3 py-2 text-xs font-semibold text-white">Prestation</th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-white w-12">Qté</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-white w-24">P.U. HT</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-white w-24">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lignes || []).map((l, i) => {
              const inclus = !l.prixUnitaire || l.prixUnitaire === 0
              const total = (l.quantite || 0) * (l.prixUnitaire || 0)
              return (
                <tr key={i} style={{ borderBottom: '1px solid #e7e5e1', background: i % 2 === 0 ? '#ffffff' : '#f5f4f1' }}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-xs" style={{ color: '#241512' }}>{l.description}</p>
                    {l.detail && <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#a89b8c' }}>{l.detail}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs" style={{ color: '#a89b8c' }}>{l.quantite}</td>
                  <td className="px-3 py-2.5 text-right text-xs" style={{ color: '#a89b8c' }}>{inclus ? 'Inclus' : `${(l.prixUnitaire || 0).toLocaleString('fr-FR')} €`}</td>
                  <td className="px-3 py-2.5 text-right text-xs" style={{ color: '#a89b8c' }}>{inclus ? '—' : `${total.toLocaleString('fr-FR')} €`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="flex justify-end mt-2">
          <div className="w-64 text-xs space-y-1">
            <div className="flex justify-between py-1" style={{ borderTop: '1px solid #e7e5e1' }}>
              <span style={{ color: '#241512' }}>Total HT</span>
              <span className="font-semibold">{fmtEur(doc.montantHT || 0)} €</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: '#a89b8c' }}>TVA — Non applicable (Art. 293 B du CGI)</span>
              <span style={{ color: '#a89b8c' }}>0,00 €</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-sm mt-1 px-2" style={{ borderTop: '2px solid #241512', background: '#f5f4f1' }}>
              <span>TOTAL TTC</span>
              <span>{fmtEur(doc.montantHT || 0)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions de paiement */}
      <div className="mb-6">
        <p className="font-bold text-xs pb-1 mb-3 uppercase tracking-wider" style={{ color: '#241512', borderBottom: '1px solid #e7e5e1' }}>CONDITIONS DE PAIEMENT</p>
        <div className="grid grid-cols-2" style={{ border: '1px solid #e7e5e1' }}>
          <div className="p-4" style={{ borderRight: '1px solid #e7e5e1' }}>
            <p className="font-bold text-xs" style={{ color: '#241512' }}>Acompte à la signature</p>
            <p className="text-base font-bold mt-1" style={{ color: '#241512' }}>{acompte}% — {fmtEur(acompteHT)} €</p>
            <p className="text-[11px] mt-1" style={{ color: '#a89b8c' }}>Démarrage des travaux à réception</p>
          </div>
          <div className="p-4">
            <p className="font-bold text-xs" style={{ color: '#241512' }}>Solde à la livraison</p>
            <p className="text-base font-bold mt-1" style={{ color: '#241512' }}>{100 - acompte}% — {fmtEur(soldeHT)} €</p>
            <p className="text-[11px] mt-1" style={{ color: '#a89b8c' }}>Avant mise en ligne du site</p>
          </div>
        </div>
        <div className="text-[11px] mt-2 space-y-1 leading-relaxed" style={{ color: '#a89b8c' }}>
          <p>Règlement par virement bancaire. Coordonnées bancaires transmises sur la facture d'acompte.</p>
          <p>En cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L.441-10 du Code de commerce).</p>
        </div>
      </div>

      {/* Conditions générales */}
      <div className="mb-6">
        <p className="font-bold text-xs pb-1 mb-2 uppercase tracking-wider" style={{ color: '#241512', borderBottom: '1px solid #e7e5e1' }}>CONDITIONS GÉNÉRALES</p>
        <div className="text-[11px] space-y-1 leading-relaxed" style={{ color: '#241512' }}>
          <p>Le présent devis est valable 30 jours à compter de sa date d'émission.</p>
          <p>Toute modification du scope entraînera l'émission d'un avenant au présent devis.</p>
          <p>Les contenus (textes, images, logos) sont à fournir par le client dans les 3 jours suivant la signature. Tout retard de fourniture de contenus entraîne un décalage équivalent du délai de livraison.</p>
          {doc.delai && <p>Le délai est de {doc.delai} à compter de la réception de l'acompte ET des contenus complets.</p>}
          <p>SC CRÉATION se réserve le droit de mentionner la réalisation de ce projet dans son portfolio, sauf demande contraire écrite du client.</p>
        </div>
        {doc.notes && <div className="mt-2 p-2 rounded text-[11px]" style={{ background: '#f5f4f1', color: '#a89b8c' }}><span className="font-semibold">Conditions particulières : </span>{doc.notes}</div>}
      </div>

      {/* Acceptation */}
      <div className="mb-4">
        <p className="font-bold text-xs pb-1 mb-3 uppercase tracking-wider" style={{ color: '#241512', borderBottom: '1px solid #e7e5e1' }}>ACCEPTATION DU DEVIS</p>
        <p className="text-[11px] italic mb-4" style={{ color: '#a89b8c' }}>Bon pour accord — À retourner signé avec la mention « Lu et approuvé »</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 rounded-lg" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-[11px] mb-0.5" style={{ color: '#a89b8c' }}>Le prestataire</p>
            <p className="text-xs font-bold" style={{ color: '#241512' }}>SC CRÉATION</p>
            <p className="text-[11px] mb-2" style={{ color: '#a89b8c' }}>Sheryn Ait Tabet & Chaïnez Raho</p>
            <p className="text-[11px]" style={{ color: '#a89b8c' }}>Date : ___/___/______</p>
            <p className="text-[11px] mt-1" style={{ color: '#a89b8c' }}>Signature :</p>
            <div className="h-8 mt-2" style={{ borderBottom: '1px solid #e7e5e1' }} />
          </div>
          <div className="p-4 rounded-lg" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-[11px] mb-0.5" style={{ color: '#a89b8c' }}>Le client</p>
            <p className="text-xs font-bold" style={{ color: '#241512' }}>{client?.nom || '—'}</p>
            <div className="mt-2" />
            <p className="text-[11px]" style={{ color: '#a89b8c' }}>Date : ___/___/______</p>
            <p className="text-[11px] mt-1" style={{ color: '#a89b8c' }}>Signature + « Lu et approuvé » :</p>
            <div className="h-8 mt-2" style={{ borderBottom: '1px solid #e7e5e1' }} />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 text-[11px] text-center" style={{ borderTop: '1px solid #eeece7', color: '#a89b8c' }}>
        SC CRÉATION • Sheryn Ait Tabet & Chaïnez Raho • 47 rue Vivienne, 75002 Paris
      </div>
    </div>
  )
}

// ─── Aperçu Contrat ───────────────────────────────────────────────────────────
function ContratPreview({ doc, client }) {
  const acompteHT = ((doc.montantHT || 0) * (doc.acompte || 30) / 100)
  const soldeHT = (doc.montantHT || 0) - acompteHT
  const today = doc.dateEmission ? new Date(doc.dateEmission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  return (
    <div className="bg-white p-10 rounded-xl text-sm leading-relaxed" style={{ border: '1px solid #e7e5e1' }} id="doc-preview">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#241512' }}>SC Création</h1>
          <p className="text-xs" style={{ color: '#a89b8c' }}>Agence Web Design</p>
          <p className="text-xs" style={{ color: '#a89b8c' }}>contact@sc-creation.fr</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold uppercase tracking-wide" style={{ color: '#241512' }}>Contrat de prestation</p>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>N° {doc.numero}</p>
          <p className="text-xs" style={{ color: '#a89b8c' }}>Fait à Paris, le {today}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-4 rounded-lg" style={{ background: '#f5f4f1' }}>
          <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#241512' }}>Le Prestataire</p>
          <p className="font-semibold" style={{ color: '#241512' }}>SC Création</p>
          <p className="text-xs" style={{ color: '#241512' }}>Agence Web Design</p>
          <p className="text-xs" style={{ color: '#a89b8c' }}>contact@sc-creation.fr</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: '#f5f4f1' }}>
          <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#a89b8c' }}>Le Client</p>
          <p className="font-semibold" style={{ color: '#241512' }}>{client?.nom || '—'}</p>
          {client?.contact && <p className="text-xs" style={{ color: '#241512' }}>{client.contact}</p>}
          {client?.email && <p className="text-xs" style={{ color: '#a89b8c' }}>{client.email}</p>}
        </div>
      </div>

      <div className="space-y-5" style={{ color: '#241512' }}>
        {/* Art. 1 */}
        <div>
          <p className="font-bold mb-1" style={{ color: '#241512' }}>Article 1 — Objet du contrat</p>
          <p className="text-xs leading-relaxed">
            Le présent contrat a pour objet de définir les conditions dans lesquelles SC Création
            réalisera la mission suivante pour le Client :{' '}
            <span className="font-medium" style={{ color: '#241512' }}>{doc.objet || '(à préciser)'}</span>.
          </p>
        </div>

        {/* Art. 2 */}
        <div>
          <p className="font-bold mb-1" style={{ color: '#241512' }}>Article 2 — Durée et délai de réalisation</p>
          <p className="text-xs leading-relaxed">
            La mission débutera à compter de la réception de l'acompte et du brief complet du Client.
            Le délai estimé de réalisation est de{' '}
            <span className="font-medium" style={{ color: '#241512' }}>{doc.delai || '(à préciser)'}</span>.
            Ce délai est conditionné à la fourniture des éléments nécessaires par le Client dans les délais convenus.
          </p>
        </div>

        {/* Art. 3 */}
        <div>
          <p className="font-bold mb-1" style={{ color: '#241512' }}>Article 3 — Conditions financières</p>
          <p className="text-xs leading-relaxed mb-2">
            Le montant total de la prestation est fixé à{' '}
            <span className="font-semibold" style={{ color: '#241512' }}>{(doc.montantHT || 0).toLocaleString('fr-FR')} € HT</span> (TVA {doc.tva}% en sus).
          </p>
          <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: '#f5f4f1' }}>
            <div className="flex justify-between">
              <span>Acompte à la signature ({doc.acompte}%)</span>
              <span className="font-semibold">{acompteHT.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} € HT</span>
            </div>
            <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #e7e5e1' }}>
              <span>Solde à la livraison ({100 - (doc.acompte || 30)}%)</span>
              <span className="font-semibold">{soldeHT.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} € HT</span>
            </div>
          </div>
        </div>

        {/* Art. 4 */}
        <div>
          <p className="font-bold mb-1" style={{ color: '#241512' }}>Article 4 — Propriété intellectuelle</p>
          <p className="text-xs leading-relaxed">
            L'ensemble des créations réalisées dans le cadre de cette mission (design, code, visuels)
            reste la propriété de SC Création jusqu'au règlement intégral de la facture. À réception
            du solde, les droits d'exploitation sont cédés au Client pour une utilisation commerciale
            illimitée dans le cadre de son activité.
          </p>
        </div>

        {/* Art. 5 */}
        <div>
          <p className="font-bold mb-1" style={{ color: '#241512' }}>Article 5 — Résiliation</p>
          <p className="text-xs leading-relaxed">
            En cas de résiliation à l'initiative du Client après le début des travaux, l'acompte versé
            reste acquis à SC Création. Si la résiliation intervient après livraison des maquettes,
            le Client devra régler 70% du montant total.
          </p>
        </div>

        {doc.notes && (
          <div>
            <p className="font-bold mb-1" style={{ color: '#241512' }}>Conditions particulières</p>
            <p className="text-xs leading-relaxed">{doc.notes}</p>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-10 mt-12 pt-6" style={{ borderTop: '1px solid #e7e5e1' }}>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#a89b8c' }}>Pour SC Création</p>
          <p className="text-xs mb-8" style={{ color: '#a89b8c' }}>Lu et approuvé — Signature :</p>
          <div className="h-10" style={{ borderBottom: '1px solid #e7e5e1' }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#a89b8c' }}>Pour le Client — {client?.nom || '—'}</p>
          <p className="text-xs mb-8" style={{ color: '#a89b8c' }}>Lu et approuvé — Signature :</p>
          <div className="h-10" style={{ borderBottom: '1px solid #e7e5e1' }} />
        </div>
      </div>
      <div className="mt-6 text-xs text-center" style={{ color: '#a89b8c' }}>SC Création — Merci pour votre confiance</div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Documents() {
  const { documents, clients, addDocument, updateDocument, deleteDocument } = useStore()
  const [modal, setModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [form, setForm] = useState(null)
  const [filterType, setFilterType] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')

  const getClient = (id) => clients.find(c => c.id === id)

  const filtered = documents.filter(d => {
    const t = filterType === 'tous' || d.type === filterType
    const s = filterStatut === 'tous' || d.statut === filterStatut
    return t && s
  })

  function openTemplate(type) {
    setForm(makeEmptyDoc(type, documents))
    setModal(true)
  }

  function addLigne() {
    const lignes = [...form.lignes, { description: '', detail: '', quantite: 1, prixUnitaire: 0 }]
    setForm({ ...form, lignes })
  }

  function updateLigne(i, field, value) {
    const lignes = [...form.lignes]
    const textFields = ['description', 'detail']
    lignes[i] = { ...lignes[i], [field]: textFields.includes(field) ? value : Number(value) }
    const montantHT = lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0)
    setForm({ ...form, lignes, montantHT })
  }

  function removeLigne(i) {
    const lignes = form.lignes.filter((_, j) => j !== i)
    const montantHT = lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0)
    setForm({ ...form, lignes, montantHT })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const saved = { ...form }
    addDocument(saved)
    setModal(false)
    setPreviewDoc(saved)
  }

  const typeLabel = { devis: 'Devis', contrat: 'Contrat', facture: 'Facture' }

  const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
  const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Documents</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>{documents.length} document{documents.length > 1 ? 's' : ''}</p>
        </div>
        {/* 3 boutons de génération */}
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => openTemplate('devis')}>
            <FileText size={15} className="text-indigo-600" /> Générer un devis
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => openTemplate('contrat')}>
            <BookOpen size={15} className="text-emerald-600" /> Générer un contrat
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => openTemplate('facture')}>
            <Receipt size={15} className="text-amber-600" /> Générer une facture
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-white rounded-lg p-1" style={{ border: '1px solid #e7e5e1' }}>
          {['tous', 'devis', 'contrat', 'facture'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all"
              style={filterType === t ? { background: '#241512', color: '#FDFCF8' } : { background: 'transparent', color: '#241512' }}>
              {t === 'tous' ? 'Tous' : typeLabel[t]}
              {' '}({documents.filter(d => t === 'tous' || d.type === t).length})
            </button>
          ))}
        </div>
        <select className="w-auto text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 transition-all" style={inputStyle} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="tous">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="envoye">Envoyé</option>
          <option value="signe">Signé</option>
          <option value="paye">Payé</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #e7e5e1' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr style={{ background: '#f5f4f1' }}>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Numéro</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Type</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Client</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Montant HT</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>TTC</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Date</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Statut</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3 w-24" style={{ color: '#a89b8c' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center sticky left-0" style={{ color: '#a89b8c' }}>Aucun document</td></tr>}
              {filtered.map(d => {
                const client = getClient(d.clientId)
                const ttc = (d.montantHT || 0) * (1 + (d.tva || 20) / 100)
                return (
                  <tr key={d.id} style={{ borderTop: '1px solid #eeece7' }}>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#241512' }}>{d.numero}</td>
                    <td className="px-4 py-3">
                      <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.type === 'devis' ? 'bg-indigo-50 text-indigo-700' :
                        d.type === 'contrat' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{typeLabel[d.type] || d.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#241512' }}>{client?.nom || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#241512' }}>{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#241512' }}>{ttc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#a89b8c' }}>{d.dateEmission ? new Date(d.dateEmission).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {statutBadge(d.statut)}
                        <select
                          className="text-xs rounded px-1 py-0.5"
                          style={{ border: '1px solid #e7e5e1', color: '#241512' }}
                          value={d.statut}
                          onChange={e => updateDocument(d.id, { statut: e.target.value })}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="envoye">Envoyé</option>
                          <option value="signe">Signé</option>
                          <option value="paye">Payé</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setPreviewDoc(d)} className="p-1.5 rounded hover:bg-[#f5f4f1]" style={{ color: '#a89b8c' }} title="Aperçu"><FileText size={14} /></button>
                        <button onClick={() => { if (confirm('Supprimer ?')) deleteDocument(d.id) }} className="p-1.5 rounded hover:bg-red-50 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de génération */}
      {form && (
        <Modal isOpen={modal} onClose={() => setModal(false)} title={`Générer un ${typeLabel[form.type]?.toLowerCase()}`} size="xl">
          <form onSubmit={handleSubmit}>
            <FormRow cols={2}>
              <FormField label="Client" required>
                <select className={inputCls} style={inputStyle} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                  <option value="">— Choisir un client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </FormField>
              <FormField label="Numéro">
                <input className={inputCls} style={inputStyle} value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
              </FormField>
            </FormRow>

            <FormRow cols={2}>
              <FormField label="Date d'émission">
                <input type="date" className={inputCls} style={inputStyle} value={form.dateEmission} onChange={e => setForm({ ...form, dateEmission: e.target.value })} />
              </FormField>
              {form.type === 'facture' && (
                <FormField label="Date d'échéance">
                  <input type="date" className={inputCls} style={inputStyle} value={form.dateEcheance} onChange={e => setForm({ ...form, dateEcheance: e.target.value })} />
                </FormField>
              )}
              {form.type !== 'facture' && (
                <FormField label="Acompte (%)">
                  <input type="number" className={inputCls} style={inputStyle} min={0} max={100} value={form.acompte} onChange={e => setForm({ ...form, acompte: Number(e.target.value) })} />
                </FormField>
              )}
            </FormRow>

            {/* Objet + délai pour devis & contrat */}
            {form.type !== 'facture' && (
              <>
                <FormField label="Objet de la prestation">
                  <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} placeholder="Ex : Création du site e-commerce — marque de vêtements en édition limitée…" value={form.objet} onChange={e => setForm({ ...form, objet: e.target.value })} />
                </FormField>
                <FormField label="Délai de réalisation">
                  <input className={inputCls} style={inputStyle} placeholder="Ex : 3 à 4 semaines" value={form.delai} onChange={e => setForm({ ...form, delai: e.target.value })} />
                </FormField>
              </>
            )}

            {/* Champs montant HT pour contrat (sans lignes) */}
            {form.type === 'contrat' && (
              <FormField label="Montant HT (€)">
                <input type="number" className={inputCls} style={inputStyle} value={form.montantHT} onChange={e => setForm({ ...form, montantHT: Number(e.target.value) })} />
              </FormField>
            )}

            {/* Lignes — devis & facture */}
            {form.type !== 'contrat' && (
              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#a89b8c' }}>Prestations</label>
                <div className="space-y-3 mb-3 mt-2">
                  {form.lignes.map((l, i) => (
                    <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #e7e5e1' }}>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1.5">
                          <input className={`${inputCls} text-xs`} style={inputStyle} placeholder="Titre de la prestation" value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)} />
                          {form.type === 'devis' && (
                            <textarea className={`${inputCls} text-xs resize-none`} style={inputStyle} rows={2} placeholder="Description (optionnel)" value={l.detail || ''} onChange={e => updateLigne(i, 'detail', e.target.value)} />
                          )}
                        </div>
                        <button type="button" onClick={() => removeLigne(i)} className="mt-1 flex-shrink-0 hover:text-red-500" style={{ color: '#a89b8c' }}>✕</button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="number" className={`${inputCls} w-16 text-xs`} style={inputStyle} placeholder="Qté" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} />
                        <input type="number" className={`${inputCls} w-28 text-xs`} style={inputStyle} placeholder="P.U € (0 = Inclus)" value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)} />
                        <span className="text-xs font-semibold flex-1 text-right" style={{ color: '#a89b8c' }}>
                          {l.prixUnitaire === 0 ? 'Inclus' : `${((l.quantite || 0) * (l.prixUnitaire || 0)).toLocaleString('fr-FR')} €`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLigne} className="text-xs hover:underline flex items-center gap-1" style={{ color: '#241512' }}>
                  <Plus size={12} /> Ajouter une ligne
                </button>
                <div className="flex justify-end mt-3">
                  <p className="text-sm font-bold" style={{ color: '#241512' }}>Total HT : {(form.montantHT || 0).toLocaleString('fr-FR')} €</p>
                </div>
              </div>
            )}

            <FormField label={form.type === 'contrat' ? 'Conditions particulières' : 'Notes'}>
              <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </FormField>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Générer →</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Aperçu après génération ou clic sur la liste */}
      {previewDoc && (
        <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`Aperçu — ${previewDoc.numero}`} size="xl">
          <div className="mb-4 flex justify-end">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }}><Printer size={15} /> Télécharger / Imprimer</button>
          </div>
          {previewDoc.type === 'contrat'
            ? <ContratPreview doc={previewDoc} client={getClient(previewDoc.clientId)} />
            : <DocumentPreview doc={previewDoc} client={getClient(previewDoc.clientId)} />
          }
        </Modal>
      )}
    </div>
  )
}
