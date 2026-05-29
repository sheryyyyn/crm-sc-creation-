import { create } from 'zustand'
import { notify } from '../utils/notify'
import {
  collection, doc, setDoc, deleteDoc, getDocs, writeBatch, onSnapshot
} from 'firebase/firestore'

const DEMO_COLLECTIONS = ['clients', 'projets', 'taches', 'rdvs', 'documents', 'leads', 'contenus', 'depenses', 'notifications']
import { db } from '../firebase'
import {
  mockClients,
  mockProjets,
  mockTaches,
  mockRDVs,
  mockDocuments,
  mockLeads,
  mockContenus,
  mockDepenses,
  mockNotifications,
  mockFormReponses,
} from '../data/mockData'

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const fsSet = (col, id, data) => setDoc(doc(db, col, id), data)
const fsDel = (col, id) => deleteDoc(doc(db, col, id))

const COLLECTIONS = ['clients', 'projets', 'taches', 'rdvs', 'documents', 'leads', 'contenus', 'depenses', 'motsDePasse', 'formReponses', 'notifications']

const SEED_MAP = {
  clients: mockClients,
  projets: mockProjets,
  taches: mockTaches,
  rdvs: mockRDVs,
  documents: mockDocuments,
  leads: mockLeads,
  contenus: mockContenus,
  depenses: mockDepenses,
  motsDePasse: [],
  formReponses: mockFormReponses,
  notifications: mockNotifications,
}

async function seedIfEmpty() {
  for (const col of COLLECTIONS) {
    const snap = await getDocs(collection(db, col))
    if (snap.empty && SEED_MAP[col].length > 0) {
      const batch = writeBatch(db)
      SEED_MAP[col].forEach((item) => {
        batch.set(doc(db, col, item.id), item)
      })
      await batch.commit()
    }
  }
}

const useStore = create((set, get) => ({
  // ─── Data ───────────────────────────────────────────────────────────────
  motsDePasse: [],
  formReponses: [],
  clients: [],
  projets: [],
  taches: [],
  rdvs: [],
  documents: [],
  leads: [],
  contenus: [],
  depenses: [],
  notifications: [],
  loading: true,

  // ─── Init Firestore listeners ────────────────────────────────────────────
  initListeners: async () => {
    await seedIfEmpty()
    const unsubs = COLLECTIONS.map((col) =>
      onSnapshot(collection(db, col), (snap) => {
        set({ [col]: snap.docs.map((d) => d.data()), loading: false })
      })
    )
    return () => unsubs.forEach((u) => u())
  },

  // ─── Clients ────────────────────────────────────────────────────────────
  addClient: (data) => {
    const item = { ...data, id: generateId('c'), createdAt: new Date().toISOString() }
    fsSet('clients', item.id, item)
  },
  updateClient: (id, data) => {
    const updated = { ...get().clients.find((c) => c.id === id), ...data }
    fsSet('clients', id, updated)
  },
  deleteClient: (id) => fsDel('clients', id),

  // ─── Projets ────────────────────────────────────────────────────────────
  addProjet: (data) => {
    const item = { ...data, id: generateId('p'), createdAt: new Date().toISOString() }
    fsSet('projets', item.id, item)
  },
  updateProjet: (id, data) => {
    const updated = { ...get().projets.find((p) => p.id === id), ...data }
    fsSet('projets', id, updated)
  },
  deleteProjet: (id) => fsDel('projets', id),

  // ─── Tâches ─────────────────────────────────────────────────────────────
  addTache: (data) => {
    const item = { ...data, id: generateId('t'), checklist: [], createdAt: new Date().toISOString() }
    fsSet('taches', item.id, item)
    const profil = typeof localStorage !== 'undefined' ? localStorage.getItem('sc-crm-profil') || 'Sheryn' : 'Sheryn'
    if (data.assignee && data.assignee !== 'Les deux' && data.assignee === profil) {
      notify('📌 Nouvelle tâche assignée', `"${data.titre}" t'a été assignée.`)
    }
  },
  updateTache: (id, data) => {
    const prev = get().taches.find((t) => t.id === id)
    const updated = { ...prev, ...data }
    fsSet('taches', id, updated)
    if (data.priorite === 'urgente' && prev?.priorite !== 'urgente') {
      notify('🔴 Tâche urgente !', `"${prev?.titre}" est passée en priorité urgente.`)
    }
    if (data.assignee && data.assignee !== prev?.assignee) {
      const profil = typeof localStorage !== 'undefined' ? localStorage.getItem('sc-crm-profil') || 'Sheryn' : 'Sheryn'
      if (data.assignee === profil || data.assignee === 'Les deux') {
        notify('📌 Tâche assignée', `"${prev?.titre}" t'a été assignée.`)
      }
    }
  },
  deleteTache: (id) => fsDel('taches', id),
  moveTache: (id, newStatut) => {
    const updated = { ...get().taches.find((t) => t.id === id), statut: newStatut }
    fsSet('taches', id, updated)
  },

  // ─── RDV ────────────────────────────────────────────────────────────────
  addRDV: (data) => {
    const item = { ...data, id: generateId('r'), compteRendu: '', prochainesActions: [], createdAt: new Date().toISOString() }
    fsSet('rdvs', item.id, item)
    const dateStr = data.date ? new Date(data.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
    notify('📅 Nouveau RDV planifié', `${data.sujet || 'Rendez-vous'}${dateStr ? ` · ${dateStr}` : ''}${data.heure ? ` à ${data.heure}` : ''}`)
  },
  updateRDV: (id, data) => {
    const updated = { ...get().rdvs.find((r) => r.id === id), ...data }
    fsSet('rdvs', id, updated)
  },
  deleteRDV: (id) => fsDel('rdvs', id),

  // ─── Documents ──────────────────────────────────────────────────────────
  addDocument: (data) => {
    const item = { ...data, id: generateId('d'), lignes: data.lignes || [], createdAt: new Date().toISOString() }
    fsSet('documents', item.id, item)
  },
  updateDocument: (id, data) => {
    const updated = { ...get().documents.find((d) => d.id === id), ...data }
    fsSet('documents', id, updated)
  },
  deleteDocument: (id) => fsDel('documents', id),

  // ─── Leads ──────────────────────────────────────────────────────────────
  addLead: (data) => {
    const item = { ...data, id: generateId('l'), relances: [], createdAt: new Date().toISOString() }
    fsSet('leads', item.id, item)
  },
  updateLead: (id, data) => {
    const updated = { ...get().leads.find((l) => l.id === id), ...data }
    fsSet('leads', id, updated)
  },
  deleteLead: (id) => fsDel('leads', id),

  // ─── Contenus ───────────────────────────────────────────────────────────
  addContenu: (data) => {
    const item = { ...data, id: generateId('co'), createdAt: new Date().toISOString() }
    fsSet('contenus', item.id, item)
  },
  updateContenu: (id, data) => {
    const updated = { ...get().contenus.find((c) => c.id === id), ...data }
    fsSet('contenus', id, updated)
  },
  deleteContenu: (id) => fsDel('contenus', id),

  // ─── Dépenses ───────────────────────────────────────────────────────────
  addDepense: (data) => {
    const item = { ...data, id: generateId('dep'), createdAt: new Date().toISOString() }
    fsSet('depenses', item.id, item)
  },
  updateDepense: (id, data) => {
    const updated = { ...get().depenses.find((d) => d.id === id), ...data }
    fsSet('depenses', id, updated)
  },
  deleteDepense: (id) => fsDel('depenses', id),

  // ─── Mots de passe ──────────────────────────────────────────────────────
  addMotDePasse: (data) => {
    const item = { ...data, id: generateId('mdp'), createdAt: new Date().toISOString() }
    fsSet('motsDePasse', item.id, item)
  },
  updateMotDePasse: (id, data) => {
    const updated = { ...get().motsDePasse.find((m) => m.id === id), ...data }
    fsSet('motsDePasse', id, updated)
  },
  deleteMotDePasse: (id) => fsDel('motsDePasse', id),

  // ─── Formulaires ────────────────────────────────────────────────────────
  addFormReponse: (data) => {
    const item = { ...data, id: generateId('fr'), lu: false, horodateur: new Date().toISOString() }
    fsSet('formReponses', item.id, item)
    notify(
      '📋 Nouveau formulaire reçu !',
      `${data.nomEntreprise || 'Un prospect'} vient de remplir le formulaire de contact.`
    )
    const tache = {
      id: generateId('t'),
      titre: `Répondre au formulaire de ${data.nomEntreprise || 'nouveau prospect'}`,
      description: `Formulaire reçu le ${new Date().toLocaleDateString('fr-FR')} — Budget : ${data.budget || '—'}`,
      assignee: 'Les deux',
      priorite: 'haute',
      statut: 'a_faire',
      clientId: '',
      projetId: '',
      deadline: '',
      notes: '',
      checklist: [],
      createdAt: new Date().toISOString(),
      formReponseId: item.id,
    }
    fsSet('taches', tache.id, tache)
  },
  markFormReponseRead: (id) => {
    const updated = { ...get().formReponses.find((r) => r.id === id), lu: true }
    fsSet('formReponses', id, updated)
  },
  markFormReponseMailEnvoye: (id) => {
    const updated = { ...get().formReponses.find((r) => r.id === id), lu: true, mailEnvoye: true }
    fsSet('formReponses', id, updated)
  },
  markFormReponseRdvBooke: (id) => {
    const updated = { ...get().formReponses.find((r) => r.id === id), rdvBooke: true }
    fsSet('formReponses', id, updated)
  },
  deleteFormReponse: (id) => fsDel('formReponses', id),
  updateFormReponse: (id, data) => {
    const updated = { ...get().formReponses.find((r) => r.id === id), ...data }
    fsSet('formReponses', id, updated)
  },
  markAllFormReponsesRead: () => {
    get().formReponses.forEach((r) => fsSet('formReponses', r.id, { ...r, lu: true }))
  },
  getUnreadFormCount: () => get().formReponses.filter((r) => !r.lu).length,

  // ─── Notifications ──────────────────────────────────────────────────────
  markNotifRead: (id) => {
    const updated = { ...get().notifications.find((n) => n.id === id), lu: true }
    fsSet('notifications', id, updated)
  },
  markAllNotifRead: () => {
    get().notifications.forEach((n) => fsSet('notifications', n.id, { ...n, lu: true }))
  },
  addNotification: (data) => {
    const item = { ...data, id: generateId('n'), lu: false, createdAt: new Date().toISOString() }
    fsSet('notifications', item.id, item)
  },

  // ─── Purge données de démo ──────────────────────────────────────────────
  purgeDemoData: async () => {
    for (const col of DEMO_COLLECTIONS) {
      const snap = await getDocs(collection(db, col))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      if (!snap.empty) await batch.commit()
    }
  },

  // ─── Computed helpers ───────────────────────────────────────────────────
  getClientById: (id) => get().clients.find((c) => c.id === id),
  getProjetById: (id) => get().projets.find((p) => p.id === id),
  getTachesByClient: (clientId) => get().taches.filter((t) => t.clientId === clientId),
  getTachesByProjet: (projetId) => get().taches.filter((t) => t.projetId === projetId),
  getRDVsByClient: (clientId) => get().rdvs.filter((r) => r.clientId === clientId),
  getDocumentsByClient: (clientId) => get().documents.filter((d) => d.clientId === clientId),
  getUnreadCount: () => get().notifications.filter((n) => !n.lu).length,
}))

export default useStore
