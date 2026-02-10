import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, FileText, Clock, Filter } from 'lucide-react';

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
            }
        } catch (error) {
            console.error('Error creating deadline:', error);
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Planning Annuel</h1>
                        <p className="text-gray-600 mt-2">Gérez les échéances de remise de documents</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        Nouvelle Échéance
                    </button>
                </div>

                {/* Filtres */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filtres:</span>
                        </div>

                        <select
                            value={filterExam}
                            onChange={(e) => setFilterExam(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {EXAM_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showUpcomingOnly}
                                onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Échéances à venir uniquement</span>
                        </label>

                        <div className="ml-auto text-sm text-gray-600">
                            {filteredDeadlines.length} échéance{filteredDeadlines.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Liste des échéances */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDeadlines.map((deadline) => {
                        const daysUntil = getDaysUntil(deadline.due_date);
                        const overdue = isOverdue(deadline.due_date);

                        return (
                            <div
                                key={deadline.id}
                                className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition-all hover:shadow-lg ${overdue
                                        ? 'border-red-500'
                                        : daysUntil <= 7
                                            ? 'border-orange-500'
                                            : 'border-purple-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">{deadline.title}</h3>
                                        <p className="text-sm text-gray-600">{getDocumentTypeLabel(deadline.document_type)}</p>
                                    </div>
                                    <button
                                        onClick={() => deleteDeadline(deadline.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {deadline.description && (
                                    <p className="text-sm text-gray-600 mb-3">{deadline.description}</p>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                            {formatDate(deadline.due_date)}
                                        </span>
                                    </div>

                                    {!overdue && daysUntil >= 0 && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock size={16} className="text-gray-400" />
                                            <span className={daysUntil <= 7 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                                Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}

                                    {overdue && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                                            <Clock size={16} />
                                            <span>En retard</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm">
                                        <FileText size={16} className="text-gray-400" />
                                        <span className="text-gray-600">
                                            {deadline.submissions_count} soumission{deadline.submissions_count > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {deadline.exam_type && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                            {deadline.exam_type}
                                        </span>
                                    )}
                                    {deadline.is_mandatory && (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                            Obligatoire
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredDeadlines.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 text-lg">Aucune échéance trouvée</p>
                        <p className="text-sm text-gray-400 mt-2">
                            {showUpcomingOnly ? 'Essayez de désactiver le filtre "à venir uniquement"' : 'Créez votre première échéance'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Créer une échéance */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nouvelle Échéance</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    value={newDeadline.title}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Ex: Compte rendu semaine 5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de document *
                                </label>
                                <select
                                    value={newDeadline.document_type}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, document_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {DOCUMENT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date limite *
                                </label>
                                <input
                                    type="date"
                                    value={newDeadline.due_date}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, due_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Examen concerné
                                </label>
                                <select
                                    value={newDeadline.exam_type}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, exam_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {EXAM_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newDeadline.description}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Instructions ou détails supplémentaires..."
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newDeadline.is_mandatory}
                                    onChange={(e) => setNewDeadline({ ...newDeadline, is_mandatory: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">Document obligatoire</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={createDeadline}
                                disabled={!newDeadline.title || !newDeadline.due_date || loading}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
