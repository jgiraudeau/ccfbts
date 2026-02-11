import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock, AlertTriangle, Star, Eye, Filter, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Student {
    id: number;
    name: string;
    email: string;
    class_name: string | null;
}

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

interface Deadline {
    id: number;
    title: string;
    due_date: string;
    submissions_count: number;
}

export default function TeacherDashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const [reviewData, setReviewData] = useState({
        status: 'reviewed',
        grade: '',
        feedback: ''
    });

    useEffect(() => {
        fetchStudents();
        fetchSubmissions();
        fetchDeadlines();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/students`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchSubmissions = async () => {
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
        }
    };

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

    const openReviewModal = (submission: Submission) => {
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
                setSelectedSubmission(null);
                fetchSubmissions();
                alert('Évaluation enregistrée ! ✅');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erreur lors de l\'enregistrement');
        }
    };

    const getStudentSubmissions = (studentId: number) => {
        return submissions.filter(s => s.student_id === studentId);
    };

    const getStudentStats = (studentId: number) => {
        const studentSubs = getStudentSubmissions(studentId);
        const total = studentSubs.length;
        const graded = studentSubs.filter(s => s.grade !== null);
        const avgGrade = graded.length > 0
            ? graded.reduce((sum, s) => sum + (s.grade || 0), 0) / graded.length
            : null;
        const pending = studentSubs.filter(s => s.status === 'pending').length;

        return { total, avgGrade, pending };
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ En attente', icon: Clock },
            'reviewed': { bg: 'bg-blue-100', text: 'text-blue-700', label: '👁️ Relu', icon: Eye },
            'approved': { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Approuvé', icon: CheckCircle },
            'rejected': { bg: 'bg-red-100', text: 'text-red-700', label: '❌ À refaire', icon: AlertTriangle }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full font-medium`}>
                <Icon size={14} />
                {badge.label}
            </span>
        );
    };

    const filteredSubmissions = filterStatus === 'all'
        ? submissions
        : submissions.filter(s => s.status === filterStatus);

    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const totalSubmissions = submissions.length;
    const avgGrade = submissions.filter(s => s.grade !== null).length > 0
        ? submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.filter(s => s.grade !== null).length
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                    <p className="text-gray-600 mt-2">Vue d'ensemble de tous vos élèves et leurs soumissions</p>
                </div>

                {/* Stats globales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-blue-600" size={24} />
                            <h3 className="text-gray-600 font-medium">Élèves</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="text-green-600" size={24} />
                            <h3 className="text-gray-600 font-medium">Soumissions</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-orange-600" size={24} />
                            <h3 className="text-gray-600 font-medium">À corriger</h3>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Star className="text-yellow-600" size={24} />
                            <h3 className="text-gray-600 font-medium">Moyenne</h3>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {avgGrade !== null ? `${avgGrade.toFixed(1)}/20` : '-'}
                        </p>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Filter size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'Tous' },
                                { value: 'pending', label: 'En attente' },
                                { value: 'reviewed', label: 'Relus' },
                                { value: 'approved', label: 'Approuvés' }
                            ].map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => setFilterStatus(filter.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === filter.value
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vue par élève */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Liste des élèves groupés par classe */}
                    <div className="lg:col-span-1">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Mes Élèves</h2>
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{students.length}</span>
                        </div>

                        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 custom-scrollbar">
                            {Object.entries(
                                students.reduce((acc, student) => {
                                    const cName = student.class_name || "Sans classe";
                                    if (!acc[cName]) acc[cName] = [];
                                    acc[cName].push(student);
                                    return acc;
                                }, {} as Record<string, Student[]>)
                            )
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([className, classStudents]) => (
                                    <div key={className} className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                                            <span className="text-sm font-bold text-indigo-700 uppercase tracking-widest">{className}</span>
                                            <span className="text-xs text-indigo-400 font-medium ml-auto">{classStudents.length} élèves</span>
                                        </div>
                                        {classStudents.map((student) => {
                                            const stats = getStudentStats(student.id);
                                            return (
                                                <div
                                                    key={student.id}
                                                    onClick={() => setSelectedStudent(student)}
                                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedStudent?.id === student.id
                                                        ? 'border-emerald-500 bg-emerald-50 shadow-md transform scale-[1.02]'
                                                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 mb-1">{student.name}</h3>
                                                            <p className="text-xs text-gray-500 mb-2 truncate max-w-[150px]">{student.email}</p>
                                                        </div>
                                                        {stats.pending > 0 && (
                                                            <span className="bg-orange-100 text-orange-600 p-1 rounded-full">
                                                                <Clock size={12} />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                                                        <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                            📄 {stats.total}
                                                        </span>
                                                        {stats.avgGrade !== null && (
                                                            <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded font-medium">
                                                                ⭐ {stats.avgGrade.toFixed(1)}
                                                            </span>
                                                        )}
                                                        {student.class_name && (
                                                            <span className="inline-flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                                                🏷️ {student.class_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Soumissions de l'élève sélectionné OU toutes les soumissions */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            {selectedStudent ? `Soumissions de ${selectedStudent.name}` : 'Toutes les soumissions'}
                        </h2>
                        <div className="space-y-4">
                            {(selectedStudent
                                ? filteredSubmissions.filter(s => s.student_id === selectedStudent.id)
                                : filteredSubmissions
                            ).map((submission) => (
                                <div
                                    key={submission.id}
                                    className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {submission.deadline_title || 'Document'}
                                            </h3>
                                            {!selectedStudent && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    👤 {submission.student_name}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className="text-sm text-gray-500">
                                                    📅 {formatDate(submission.submitted_at)}
                                                </span>
                                                {getStatusBadge(submission.status)}
                                            </div>

                                            {submission.grade !== null && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Star size={18} className="text-yellow-500" />
                                                    <span className="text-xl font-bold text-gray-900">
                                                        {submission.grade}/20
                                                    </span>
                                                </div>
                                            )}

                                            {submission.feedback && (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
                                                    <p className="text-sm text-blue-800">{submission.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        {submission.file_url && (
                                            <a
                                                href={`${API_URL}${submission.file_url}`}
                                                download
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <Download size={18} />
                                                Télécharger
                                            </a>
                                        )}
                                        <button
                                            onClick={() => openReviewModal(submission)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            <Eye size={18} />
                                            {submission.grade !== null ? 'Modifier la note' : 'Noter'}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {(selectedStudent
                                ? filteredSubmissions.filter(s => s.student_id === selectedStudent.id)
                                : filteredSubmissions
                            ).length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-600">Aucune soumission trouvée</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de notation */}
            {showReviewModal && selectedSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Évaluer la soumission
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <select
                                    value={reviewData.status}
                                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="reviewed">Relu</option>
                                    <option value="approved">Approuvé</option>
                                    <option value="rejected">À refaire</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note sur 20
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={reviewData.grade}
                                    onChange={(e) => setReviewData({ ...reviewData, grade: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Ex: 15.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Commentaire
                                </label>
                                <textarea
                                    value={reviewData.feedback}
                                    onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    rows={4}
                                    placeholder="Votre feedback pour l'élève..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitReview}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
