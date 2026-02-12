import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, FileText, Clock, Filter, GraduationCap } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Deadline {
    id: number;
    title: string;
    description: string | null;
    document_type: string;
    due_date: string;
    exam_type: string | null;
    is_mandatory: boolean;
    created_at: string;
    submissions_count: number;
}

const DOCUMENT_TYPES = [
    { value: 'diaporama', label: '📊 Diaporama' },
    { value: 'compte_rendu_hebdo', label: '📄 Compte Rendu Hebdo' },
    { value: 'fiche_activite', label: '📋 Fiche d\'Activité' },
    { value: 'attestation_stage', label: '✅ Attestation de Stage' },
    { value: 'annexes', label: '📎 Annexes' },
    { value: 'autre', label: '📁 Autre' }
];

const EXAM_TYPES = [
    { value: 'ALL', label: 'Tous les examens' },
    { value: 'E4', label: 'E4 uniquement' },
    { value: 'E6', label: 'E6 uniquement' }
];

export default function PlanningManager() {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [filteredDeadlines, setFilteredDeadlines] = useState<Deadline[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterExam, setFilterExam] = useState<string>('ALL');
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);

    const [newDeadline, setNewDeadline] = useState({
        title: '',
        description: '',
        document_type: 'compte_rendu_hebdo',
        due_date: '',
        exam_type: 'ALL',
        is_mandatory: true
    });

    useEffect(() => {
        fetchDeadlines();
    }, []);

    useEffect(() => {
        filterDeadlines();
    }, [deadlines, filterExam, showUpcomingOnly]);

    const fetchDeadlines = async () => {
        try {
            const response = await fetch(`${API_URL}/api/deadlines`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setDeadlines(data);
            }
        } catch (error) {
            console.error('Error fetching deadlines:', error);
        }
    };

    const filterDeadlines = () => {
        let filtered = [...deadlines];

        // Filtre par type d'examen
        if (filterExam !== 'ALL') {
            filtered = filtered.filter(d => d.exam_type === filterExam || d.exam_type === 'ALL');
        }

        // Filtre échéances à venir
        if (showUpcomingOnly) {
            const today = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(d => d.due_date >= today);
        }

        // Tri par date
        filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        setFilteredDeadlines(filtered);
    };

    const createDeadline = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/deadlines`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newDeadline)
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewDeadline({
                    title: '',
                    description: '',
                    document_type: 'compte_rendu_hebdo',
                    due_date: '',
                    exam_type: 'ALL',
                    is_mandatory: true
                });
                fetchDeadlines();
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                alert(`Erreur: ${errorData.detail || "Le serveur a renvoyé une erreur (" + response.status + ")"}`);
            }
        } catch (error) {
            console.error('Error creating deadline:', error);
            alert("Erreur réseau ou serveur inaccessible.");
        } finally {
            setLoading(false);
        }
    };

    const deleteDeadline = async (deadlineId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette échéance ?')) return;

        try {
            const response = await fetch(`${API_URL}/api/deadlines/${deadlineId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchDeadlines();
            }
        } catch (error) {
            console.error('Error deleting deadline:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    const getDaysUntil = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getDocumentTypeLabel = (type: string) => {
        return DOCUMENT_TYPES.find(dt => dt.value === type)?.label || type;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Planning Annuel</h1>
                        <p className="text-gray-500 mt-2 text-lg">Gérez les échéances de remise de documents</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nouvelle Échéance
                    </button>
                </div>

                {/* Filtres */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-wrap gap-6 items-center">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Filtres</span>
                        </div>

                        <select
                            value={filterExam}
                            onChange={(e) => setFilterExam(e.target.value)}
                            className="bg-gray-50 px-4 py-2 rounded-xl border-none font-semibold text-gray-600 focus:ring-2 focus:ring-indigo-500"
                        >
                            {EXAM_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${showUpcomingOnly ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200 bg-white'}`}>
                                {showUpcomingOnly && <Plus size={14} className="text-white rotate-45" style={{ transform: 'rotate(0deg)' }} />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={showUpcomingOnly}
                                onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                            />
                            <span className="text-sm font-bold text-gray-600">Échéances à venir</span>
                        </label>

                        <div className="ml-auto flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl">
                            <span className="text-indigo-600 font-bold">{filteredDeadlines.length}</span>
                            <span className="text-indigo-400 text-sm font-bold uppercase tracking-wider text-xs">Échéances</span>
                        </div>
                    </div>
                </div>

                {/* Liste des échéances */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredDeadlines.map((deadline) => {
                        const daysUntil = getDaysUntil(deadline.due_date);
                        const overdue = isOverdue(deadline.due_date);

                        return (
                            <div
                                key={deadline.id}
                                className={`bg-white rounded-[2rem] p-8 border-2 transition-all hover:shadow-2xl hover:scale-[1.02] relative group ${overdue
                                        ? 'border-red-100 bg-red-50/10'
                                        : daysUntil <= 7
                                            ? 'border-amber-100 bg-amber-50/10'
                                            : 'border-transparent shadow-xl shadow-gray-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-gray-50 rounded-2xl text-2xl">
                                        {deadline.document_type === 'diaporama' ? '📊' :
                                            deadline.document_type === 'compte_rendu_hebdo' ? '📄' :
                                                deadline.document_type === 'fiche_activite' ? '📋' :
                                                    deadline.document_type === 'attestation_stage' ? '✅' : '📁'}
                                    </div>
                                    <button
                                        onClick={() => deleteDeadline(deadline.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">{deadline.title}</h3>
                                {deadline.description && (
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2">{deadline.description}</p>
                                )}

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${overdue ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Limite</p>
                                            <p className={`font-bold ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                                                {formatDate(deadline.due_date)}
                                            </p>
                                        </div>
                                    </div>

                                    {!overdue && (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${daysUntil <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps restant</p>
                                                <p className={`font-bold ${daysUntil <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {daysUntil === 0 ?\"Aujourd'hui\" : `${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {overdue && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-600 text-white">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</p>
                                                <p className="font-bold text-red-600">En retard</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">
                                            {deadline.submissions_count}
                                        </div>
                                        <span className="ml-10 text-[10px] font-black text-gray-400 uppercase tracking-widest self-center">Soumissions</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {deadline.exam_type !== 'ALL' && (
                                            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                                                {deadline.exam_type}
                                            </span>
                                        )}
                                        {deadline.is_mandatory && (
                                            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                                                Obligatoire
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredDeadlines.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl shadow-gray-100 border-2 border-dashed border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={48} className="text-gray-200" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Aucune échéance</h2>
                        <p className="text-gray-400 max-w-sm mx-auto font-medium">
                            {showUpcomingOnly ? 'Toutes les tâches sont à jour ou archivées.' : 'Commencez par planifier votre première échéance pédagogique.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Créer une échéance */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">Nouvelle Échéance</h2>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">BTS NDRC Planning</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Titre de l'échéance *</label>
                                <input
                                    type="text"
                                    value={newDeadline.title}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none"
                                    placeholder="Ex: Dossier Professionnel"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Document *</label>
                                    <select
                                        value={newDeadline.document_type}
                                        onChange={(e) => setNewDeadline({ ...newDeadline, document_type: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none appearance-none"
                                    >
                                        {DOCUMENT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Date Limite *</label>
                                    <input
                                        type="date"
                                        value={newDeadline.due_date}
                                        onChange={(e) => setNewDeadline({ ...newDeadline, due_date: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Examen</label>
                                <select
                                    value={newDeadline.exam_type}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, exam_type: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none appearance-none"
                                >
                                    {EXAM_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Description</label>
                                <textarea
                                    value={newDeadline.description}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none min-h-[100px] resize-none"
                                    placeholder="Ajoutez des détails ou consignes..."
                                />
                            </div>

                            <label className="flex items-center gap-4 cursor-pointer group p-2">
                                <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${newDeadline.is_mandatory ? 'bg-red-600 border-red-600 shadow-lg shadow-red-100' : 'border-gray-200 bg-white'}`}>
                                    {newDeadline.is_mandatory && <Plus size={18} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={newDeadline.is_mandatory}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, is_mandatory: e.target.checked })}
                                />
                                <span className="text-sm font-black text-gray-900 uppercase tracking-widest underline decoration-red-100 underline-offset-4">Échéance Obligatoire</span>
                            </label>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-8 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={createDeadline}
                                disabled={!newDeadline.title || !newDeadline.due_date || loading}
                                className="flex-[1.5] px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? 'Transmission...' : 'Créer l\'Échéance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
