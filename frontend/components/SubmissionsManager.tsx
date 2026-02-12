import React, { useState, useEffect } from 'react';
import {
    FileText, Search, Filter, Download, Eye,
    CheckCircle, Clock, AlertTriangle, User,
    Calendar, ChevronRight, ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Submission {
    id: number;
    student_id: number;
    deadline_id: number;
    file_url: string | null;
    file_name: string | null;
    submitted_at: string;
    status: string;
    grade: number | null;
    feedback: string | null;
    student_name: string | null;
    deadline_title: string | null;
}

export default function SubmissionsManager() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const [reviewData, setReviewData] = useState({
        status: 'reviewed',
        grade: '',
        feedback: ''
    });

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/tracking/submissions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data);
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = (submission: Submission) => {
        setSelectedSubmission(submission);
        setReviewData({
            status: submission.status || 'reviewed',
            grade: submission.grade?.toString() || '',
            feedback: submission.feedback || ''
        });
        setShowReviewModal(true);
    };

    const submitReview = async () => {
        if (!selectedSubmission) return;

        try {
            const response = await fetch(`${API_URL}/api/tracking/submissions/${selectedSubmission.id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    status: reviewData.status,
                    grade: reviewData.grade ? parseFloat(reviewData.grade) : null,
                    feedback: reviewData.feedback
                })
            });

            if (response.ok) {
                setShowReviewModal(false);
                fetchSubmissions();
                alert('Évaluation enregistrée ! ✅');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erreur lors de l\'enregistrement');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle size={14} />;
            case 'rejected': return <AlertTriangle size={14} />;
            case 'reviewed': return <Eye size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const filteredSubmissions = submissions.filter(s => {
        const matchesSearch =
            (s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (s.deadline_title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (s.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Documents Déposés</h1>
                        <p className="text-gray-500 mt-2 text-lg font-medium">Consultez et évaluez les travaux de vos élèves</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        {['all', 'pending', 'reviewed', 'approved'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === status
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {status === 'all' ? 'Tous' : status === 'pending' ? 'À corriger' : status === 'reviewed' ? 'Relus' : 'Approuvés'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-50 p-6 mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un élève, un document ou un titre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Chargement des documents...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSubmissions.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[3rem] shadow-xl shadow-gray-100 border-2 border-dashed border-gray-100">
                                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Aucun document</h2>
                                <p className="text-gray-400 font-medium">Aucune soumission ne correspond à vos critères.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredSubmissions.map((submission) => (
                                    <div
                                        key={submission.id}
                                        className="bg-white rounded-[2rem] p-6 shadow-sm border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                            {/* Info Document */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border flex items-center gap-1.5 ${getStatusStyle(submission.status)}`}>
                                                        {getStatusIcon(submission.status)}
                                                        {submission.status === 'pending' ? 'En attente' :
                                                            submission.status === 'reviewed' ? 'Relu' :
                                                                submission.status === 'approved' ? 'Approuvé' : 'À refaire'}
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                        {submission.deadline_title || 'Sans échéance'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {submission.file_name || 'Document sans nom'}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <User size={12} />
                                                        </div>
                                                        <span className="font-bold text-gray-700">{submission.student_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <Calendar size={14} />
                                                        <span className="font-medium">{formatDate(submission.submitted_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Note & Feedback Quick View */}
                                            {submission.grade !== null && (
                                                <div className="lg:px-8 border-l border-gray-100 hidden xl:block">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Note</p>
                                                    <p className="text-2xl font-black text-indigo-600">{submission.grade}<span className="text-xs text-gray-300">/20</span></p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 lg:ml-auto">
                                                {submission.file_url && (
                                                    <a
                                                        href={`${API_URL}${submission.file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                                        title="Ouvrir le document"
                                                    >
                                                        <ExternalLink size={20} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleReview(submission)}
                                                    className="px-6 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-indigo-600 shadow-lg shadow-gray-200 hover:shadow-indigo-100 transition-all flex items-center gap-2"
                                                >
                                                    <Eye size={18} />
                                                    {submission.grade !== null ? 'Modifier' : 'Évaluer'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de notation */}
            {showReviewModal && selectedSubmission && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">Évaluer le Document</h2>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">
                                    {selectedSubmission.student_name}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Statut de la correction</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'reviewed', label: 'Relu', icon: Eye, color: 'blue' },
                                        { id: 'approved', label: 'Approuvé', icon: CheckCircle, color: 'emerald' },
                                        { id: 'rejected', label: 'À refaire', icon: AlertTriangle, color: 'red' }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setReviewData({ ...reviewData, status: s.id })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${reviewData.status === s.id
                                                    ? `bg-${s.color}-50 border-${s.color}-600 text-${s.color}-700`
                                                    : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            <s.icon size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Note (facultatif)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                        value={reviewData.grade}
                                        onChange={(e) => setReviewData({ ...reviewData, grade: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-black text-2xl text-gray-700 outline-none"
                                        placeholder="--"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xl">/ 20</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Commentaires & Feedback</label>
                                <textarea
                                    value={reviewData.feedback}
                                    onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 outline-none min-h-[120px] resize-none"
                                    placeholder="Quels sont les points d'amélioration ?"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 px-8 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitReview}
                                className="flex-[1.5] px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs"
                            >
                                Valider la Correction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
