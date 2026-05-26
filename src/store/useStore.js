import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

const useStore = create(
  persist(
    (set, get) => ({
      // ─── Data ───────────────────────────────────────────────────────────────
      motsDePasse: [],
      formReponses: mockFormReponses,
      clients: mockClients,
      projets: mockProjets,
      taches: mockTaches,
      rdvs: mockRDVs,
      documents: mockDocuments,
      leads: mockLeads,
      contenus: mockContenus,
      depenses: mockDepenses,
      notifications: mockNotifications,

      // ─── Clients ────────────────────────────────────────────────────────────
      addClient: (data) => set((s) => ({
        clients: [...s.clients, { ...data, id: generateId('c'), createdAt: new Date().toISOString() }],
      })),
      updateClient: (id, data) => set((s) => ({
        clients: s.clients.map((c) => c.id === id ? { ...c, ...data } : c),
      })),
      deleteClient: (id) => set((s) => ({
        clients: s.clients.filter((c) => c.id !== id),
      })),

      // ─── Projets ────────────────────────────────────────────────────────────
      addProjet: (data) => set((s) => ({
        projets: [...s.projets, { ...data, id: generateId('p'), createdAt: new Date().toISOString() }],
      })),
      updateProjet: (id, data) => set((s) => ({
        projets: s.projets.map((p) => p.id === id ? { ...p, ...data } : p),
      })),
      deleteProjet: (id) => set((s) => ({
        projets: s.projets.filter((p) => p.id !== id),
      })),

      // ─── Tâches ─────────────────────────────────────────────────────────────
      addTache: (data) => set((s) => ({
        taches: [...s.taches, { ...data, id: generateId('t'), checklist: [], createdAt: new Date().toISOString() }],
      })),
      updateTache: (id, data) => set((s) => ({
        taches: s.taches.map((t) => t.id === id ? { ...t, ...data } : t),
      })),
      deleteTache: (id) => set((s) => ({
        taches: s.taches.filter((t) => t.id !== id),
      })),
      moveTache: (id, newStatut) => set((s) => ({
        taches: s.taches.map((t) => t.id === id ? { ...t, statut: newStatut } : t),
      })),

      // ─── RDV ────────────────────────────────────────────────────────────────
      addRDV: (data) => set((s) => ({
        rdvs: [...s.rdvs, { ...data, id: generateId('r'), compteRendu: '', prochainesActions: [], createdAt: new Date().toISOString() }],
      })),
      updateRDV: (id, data) => set((s) => ({
        rdvs: s.rdvs.map((r) => r.id === id ? { ...r, ...data } : r),
      })),
      deleteRDV: (id) => set((s) => ({
        rdvs: s.rdvs.filter((r) => r.id !== id),
      })),

      // ─── Documents ──────────────────────────────────────────────────────────
      addDocument: (data) => set((s) => ({
        documents: [...s.documents, { ...data, id: generateId('d'), lignes: data.lignes || [], createdAt: new Date().toISOString() }],
      })),
      updateDocument: (id, data) => set((s) => ({
        documents: s.documents.map((d) => d.id === id ? { ...d, ...data } : d),
      })),
      deleteDocument: (id) => set((s) => ({
        documents: s.documents.filter((d) => d.id !== id),
      })),

      // ─── Leads ──────────────────────────────────────────────────────────────
      addLead: (data) => set((s) => ({
        leads: [...s.leads, { ...data, id: generateId('l'), relances: [], createdAt: new Date().toISOString() }],
      })),
      updateLead: (id, data) => set((s) => ({
        leads: s.leads.map((l) => l.id === id ? { ...l, ...data } : l),
      })),
      deleteLead: (id) => set((s) => ({
        leads: s.leads.filter((l) => l.id !== id),
      })),

      // ─── Contenus ───────────────────────────────────────────────────────────
      addContenu: (data) => set((s) => ({
        contenus: [...s.contenus, { ...data, id: generateId('co'), createdAt: new Date().toISOString() }],
      })),
      updateContenu: (id, data) => set((s) => ({
        contenus: s.contenus.map((c) => c.id === id ? { ...c, ...data } : c),
      })),
      deleteContenu: (id) => set((s) => ({
        contenus: s.contenus.filter((c) => c.id !== id),
      })),

      // ─── Dépenses ───────────────────────────────────────────────────────────
      addDepense: (data) => set((s) => ({
        depenses: [...s.depenses, { ...data, id: generateId('dep'), createdAt: new Date().toISOString() }],
      })),
      updateDepense: (id, data) => set((s) => ({
        depenses: s.depenses.map((d) => d.id === id ? { ...d, ...data } : d),
      })),
      deleteDepense: (id) => set((s) => ({
        depenses: s.depenses.filter((d) => d.id !== id),
      })),

      // ─── Mots de passe ──────────────────────────────────────────────────────
      addMotDePasse: (data) => set((s) => ({
        motsDePasse: [...s.motsDePasse, { ...data, id: generateId('mdp'), createdAt: new Date().toISOString() }],
      })),
      updateMotDePasse: (id, data) => set((s) => ({
        motsDePasse: s.motsDePasse.map((m) => m.id === id ? { ...m, ...data } : m),
      })),
      deleteMotDePasse: (id) => set((s) => ({
        motsDePasse: s.motsDePasse.filter((m) => m.id !== id),
      })),

      // ─── Formulaires ────────────────────────────────────────────────────────
      addFormReponse: (data) => set((s) => ({
        formReponses: [{ ...data, id: generateId('fr'), lu: false, horodateur: new Date().toISOString() }, ...s.formReponses],
      })),
      markFormReponseRead: (id) => set((s) => ({
        formReponses: s.formReponses.map((r) => r.id === id ? { ...r, lu: true } : r),
      })),
      markAllFormReponsesRead: () => set((s) => ({
        formReponses: s.formReponses.map((r) => ({ ...r, lu: true })),
      })),
      getUnreadFormCount: () => get().formReponses.filter((r) => !r.lu).length,

      // ─── Notifications ──────────────────────────────────────────────────────
      markNotifRead: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, lu: true } : n),
      })),
      markAllNotifRead: () => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, lu: true })),
      })),
      addNotification: (data) => set((s) => ({
        notifications: [{ ...data, id: generateId('n'), lu: false, createdAt: new Date().toISOString() }, ...s.notifications],
      })),

      // ─── Computed helpers ───────────────────────────────────────────────────
      getClientById: (id) => get().clients.find((c) => c.id === id),
      getProjetById: (id) => get().projets.find((p) => p.id === id),
      getTachesByClient: (clientId) => get().taches.filter((t) => t.clientId === clientId),
      getTachesByProjet: (projetId) => get().taches.filter((t) => t.projetId === projetId),
      getRDVsByClient: (clientId) => get().rdvs.filter((r) => r.clientId === clientId),
      getDocumentsByClient: (clientId) => get().documents.filter((d) => d.clientId === clientId),
      getUnreadCount: () => get().notifications.filter((n) => !n.lu).length,
    }),
    {
      name: 'sc-creation-storage',
      version: 1,
    }
  )
)

export default useStore
