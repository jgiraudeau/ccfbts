import React, { useState, useEffect } from 'react';
import { Calendar, Upload, FileText, CheckCircle, Clock, AlertCircle, Download, Star } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Deadline {
    id: number;
    title: string;
    description: string | null;
    document_type: string;
    due_date: string;
    exam_type: string | null;
    is_mandatory: boolean;
}

interface Submission {
    id: number;
    deadline_id: number;
    file_url: string | null;
    file_name: string | null;
    submitted_at: string;
    status: string;
    grade: number | null;
    feedback: string | null;
    deadline_title: string | null;
}

export default function StudentDeadlines() {
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadingFor, setUploadingFor] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'submitted'>('upcoming');

    useEffect(() => {
        fetchDeadlines();
        fetchSubmissions();
    }, []);

    const fetchDeadlines = async () => {
        try {
            const response = await fetch(`${API_URL}/api/deadlines?upcoming_only=true`, {
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

    const fetchSubmissions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/submissions`, {
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
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, deadlineId: number) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadingFor(deadlineId);
        }
    };

    const submitDocument = async (deadlineId: number) => {
        if (!selectedFile) return;

        setLoading(true);
        try {
            // 1. Upload le fichier
            const formData = new FormData();
            formData.append('file', selectedFile);

            const uploadResponse = await fetch(`${API_URL}/api/submissions/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const uploadData = await uploadResponse.json();

            // 2. Créer la soumission
            const submitResponse = await fetch(`${API_URL}/api/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    deadline_id: deadlineId,
                    file_url: uploadData.file_url,
                    file_name: uploadData.file_name
                })
            });

            if (submitResponse.ok) {
                setSelectedFile(null);
                setUploadingFor(null);
                fetchDeadlines();
                fetchSubmissions();
                alert('Document soumis avec succès ! ✅');
            }
        } catch (error) {
            console.error('Error submitting document:', error);
            alert('Erreur lors de la soumission. Veuillez réessayer.');
        } finally {
            setLoading(false);
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

    const getDaysUntil = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const isSubmitted = (deadlineId: number) => {
        return submissions.some(s => s.deadline_id === deadlineId);
    };

    const getSubmission = (deadlineId: number) => {
        return submissions.find(s => s.deadline_id === deadlineId);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ En attente' },
            'reviewed': { bg: 'bg-blue-100', text: 'text-blue-700', label: '👁️ Relu' },
            'approved': { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Approuvé' },
            'rejected': { bg: 'bg-red-100', text: 'text-red-700', label: '❌ À refaire' }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full font-medium`}>
                {badge.label}
            </span>
        );
    };

    const upcomingDeadlines = deadlines.filter(d => !isSubmitted(d.id));
    const submittedDeadlines = submissions.sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mes Échéances</h1>
                    <p className="text-gray-600 mt-2">Suivez vos documents à rendre et vos notes</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'upcoming'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Clock size={20} />
                        À rendre ({upcomingDeadlines.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('submitted')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'submitted'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <CheckCircle size={20} />
                        Rendus ({submittedDeadlines.length})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'upcoming' && (
                    <div className="space-y-4">
                        {upcomingDeadlines.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                                <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
                                <p className="text-gray-600 text-lg">Tous vos documents sont à jour ! 🎉</p>
                                <p className="text-sm text-gray-400 mt-2">Aucune échéance en attente</p>
                            </div>
                        ) : (
                            upcomingDeadlines.map((deadline) => {
                                const daysUntil = getDaysUntil(deadline.due_date);
                                const isUrgent = daysUntil <= 3;
                                const isOverdue = daysUntil < 0;

                                return (
                                    <div
                                        key={deadline.id}
                                        className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${isOverdue
                                                ? 'border-red-500'
                                                : isUrgent
                                                    ? 'border-orange-500'
                                                    : 'border-blue-500'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                    {deadline.title}
                                                </h3>
                                                {deadline.description && (
                                                    <p className="text-gray-600 mb-3">{deadline.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar size={16} />
                                                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                                            {formatDate(deadline.due_date)}
                                                        </span>
                                                    </div>
                                                    {!isOverdue && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isUrgent
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {daysUntil === 0 ? "Aujourd'hui" : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                                                        </span>
                                                    )}
                                                    {isOverdue && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                            <AlertCircle size={14} />
                                                            En retard
                                                        </span>
                                                    )}
                                                    {deadline.exam_type && (
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                            {deadline.exam_type}
                                                        </span>
                                                    )}
                                                    {deadline.is_mandatory && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                            Obligatoire
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 items-center">
                                            <input
                                                type="file"
                                                id={`file-${deadline.id}`}
                                                onChange={(e) => handleFileSelect(e, deadline.id)}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor={`file-${deadline.id}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                                            >
                                                <Upload size={18} />
                                                {uploadingFor === deadline.id && selectedFile
                                                    ? selectedFile.name
                                                    : 'Choisir un fichier'}
                                            </label>
                                            {uploadingFor === deadline.id && selectedFile && (
                                                <button
                                                    onClick={() => submitDocument(deadline.id)}
                                                    disabled={loading}
                                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? 'Envoi...' : 'Soumettre'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'submitted' && (
                    <div className="space-y-4">
                        {submittedDeadlines.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg shadow-md">
                                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600 text-lg">Aucun document soumis</p>
                                <p className="text-sm text-gray-400 mt-2">Vos soumissions apparaîtront ici</p>
                            </div>
                        ) : (
                            submittedDeadlines.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                {submission.deadline_title || 'Document'}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    <span>Soumis le {formatDate(submission.submitted_at)}</span>
                                                </div>
                                                {getStatusBadge(submission.status)}
                                            </div>

                                            {submission.grade !== null && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Star size={20} className="text-yellow-500" />
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {submission.grade}/20
                                                    </span>
                                                </div>
                                            )}

                                            {submission.feedback && (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                                        💬 Commentaire du professeur :
                                                    </p>
                                                    <p className="text-blue-800">{submission.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {submission.file_url && (
                                        <a
                                            href={`${API_URL}${submission.file_url}`}
                                            download
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <Download size={18} />
                                            Télécharger mon document
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
