import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Calendar, User, Trash2, Eye } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SubmissionsViewProps {
    students: any[];
    submissions: any[];
    onRefresh: () => void;
    onBack: () => void;
}

export default function SubmissionsView({ students, submissions, onRefresh, onBack }: SubmissionsViewProps) {
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [filterType, setFilterType] = useState<string>('all');

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cette soumission ?")) return;
        try {
            const res = await fetch(`${API_URL}/api/submissions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                onRefresh();
                setSelectedSubmission(null);
            }
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const getStudentName = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : `Étudiant #${studentId}`;
    };

    const filteredSubmissions = filterType === 'all'
        ? submissions
        : submissions.filter(s => s.submission_type === filterType);

    const submissionsByStudent = filteredSubmissions.reduce((acc: any, sub: any) => {
        if (!acc[sub.student_id]) acc[sub.student_id] = [];
        acc[sub.student_id].push(sub);
        return acc;
    }, {});

    return (
        <div className="animate-slide-up max-w-7xl mx-auto space-y-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium"
            >
                <ArrowLeft size={20} /> Retour au tableau de bord
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-indigo-600" />
                        Documents Déposés par les Étudiants
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tous ({submissions.length})
                        </button>
                        <button
                            onClick={() => setFilterType('E4_SITUATION')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'E4_SITUATION'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            E4
                        </button>
                        <button
                            onClick={() => setFilterType('E6_CR')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'E6_CR'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            E6
                        </button>
                    </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Aucun document déposé pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Liste des soumissions */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {Object.keys(submissionsByStudent).map(studentId => {
                                const studentSubs = submissionsByStudent[studentId];
                                return (
                                    <div key={studentId} className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <User size={18} className="text-indigo-600" />
                                            {getStudentName(parseInt(studentId))}
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                {studentSubs.length} doc{studentSubs.length > 1 ? 's' : ''}
                                            </span>
                                        </h3>
                                        <div className="space-y-2">
                                            {studentSubs.map((sub: any) => (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedSubmission?.id === sub.id
                                                        ? 'bg-indigo-50 border-2 border-indigo-600'
                                                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                {sub.title}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(sub.date).toLocaleDateString()}
                                                                </span>
                                                                <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium">
                                                                    {sub.submission_type === 'E4_SITUATION' ? 'E4' : 'E6'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Eye size={16} className="text-gray-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Détail de la soumission sélectionnée */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            {selectedSubmission ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {selectedSubmission.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Par {getStudentName(selectedSubmission.student_id)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(selectedSubmission.id)}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={16} />
                                            {new Date(selectedSubmission.date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium">
                                            {selectedSubmission.submission_type}
                                        </span>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">Contenu :</h4>
                                        <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                                                {selectedSubmission.content}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Sélectionnez un document pour voir les détails</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
