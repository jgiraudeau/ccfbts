import React, { useMemo } from 'react';
import {
    ArrowLeft, GraduationCap, Activity, Crosshair, History, Pencil, Trash2,
    Monitor, Users, Handshake, FileText, Briefcase
} from "lucide-react";
import { calculateGrade, Domain } from '../app/types';
import { Line, Radar } from 'react-chartjs-2';
import { DOMAINS as ALL_DOMAINS } from '../app/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StudentViewProps {
    student: any;
    evaluations: any[];
    finalEvaluation: any;
    classAverages: any;
    selectedBlock?: 'E4' | 'E6';
    onBack: () => void;
    onEdit: (item: any, type: string) => void;
    onDelete: (id: number, type: string) => void;
    submissions?: any[];
}

const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarColor = (id: number) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
    return colors[id % colors.length];
};

export default function StudentView({ student, evaluations, finalEvaluation, classAverages, selectedBlock = 'E6', onBack, onEdit, onDelete, submissions = [] }: StudentViewProps) {

    // Filter domains based on selected block
    const DOMAINS = useMemo(() => {
        const filtered: Record<string, any> = {};
        Object.keys(ALL_DOMAINS).forEach(key => {
            const domain = ALL_DOMAINS[key];
            if (domain.exam === selectedBlock) {
                filtered[key] = domain;
            }
        });
        return filtered;
    }, [selectedBlock]);

    const handleExport = async (format: 'pdf' | 'docx') => {
        try {
            const response = await fetch(`${API_URL}/api/export/${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: student.id,
                    exam_type: selectedBlock,
                    evaluations: evaluations
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Bilan_${student.name.replace(' ', '_')}.${format === 'docx' ? 'docx' : 'pdf'}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Erreur lors de l'export.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion.");
        }
    };

    const handleExportPDF = () => handleExport('pdf');
    const handleExportWord = () => handleExport('docx');

    const allHistory = useMemo(() => {

        const continuous = evaluations.map(e => ({
            ...e,
            type: 'continuous',
            // On peut améliorer ça en passant DOMAINS en props ou import complet
            title: DOMAINS[e.domainId]?.subtitle || e.domainId
        }));
        const final = finalEvaluation ? [{ ...finalEvaluation, type: 'final', title: 'CCF Final', date: finalEvaluation.date }] : [];
        return [...continuous, ...final].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [evaluations, finalEvaluation]);

    const studentAverage = useMemo(() => {
        let total = 0, count = 0;
        evaluations.forEach(ev => { const g = calculateGrade(ev.ratings); if (g) { total += parseFloat(g); count++; } });
        return count > 0 ? (total / count).toFixed(1) : null;
    }, [evaluations]);

    const studentDomainAverages = useMemo(() => {
        const avgs: any = {};
        Object.keys(DOMAINS).forEach(domainId => {
            const domainEvals = evaluations.filter(e => e.domainId === domainId);
            let total = 0, count = 0;
            domainEvals.forEach(e => {
                const g = calculateGrade(e.ratings);
                if (g) { total += parseFloat(g); count++; }
            });
            avgs[domainId] = count > 0 ? (total / count).toFixed(1) : 0;
        });
        return avgs;
    }, [evaluations]);

    // Graphique Line
    const lineData = {
        labels: [...allHistory].reverse().map(h => new Date(h.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Note Étudiant',
                data: [...allHistory].reverse().map(h => parseFloat(calculateGrade(h.ratings) || "0")),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.3,
                fill: true
            },
            {
                label: 'Moyenne Classe',
                data: new Array(allHistory.length).fill(classAverages.global),
                borderColor: '#9ca3af',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0
            }
        ]
    };

    // Graphique Radar
    const radarData = {
        labels: Object.values(DOMAINS).map(d => d.subtitle),
        datasets: [
            {
                label: 'Étudiant',
                data: Object.keys(DOMAINS).map(key => parseFloat(studentDomainAverages[key] || 0)),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderWidth: 2
            },
            {
                label: 'Moyenne Classe',
                data: Object.keys(DOMAINS).map(key => parseFloat(classAverages.domains[key] || 0)),
                borderColor: '#9ca3af',
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                borderWidth: 2
            }
        ]
    };

    return (
        <div className="animate-slide-up space-y-8">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft size={20} /> Retour
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                <div className="flex items-center gap-6 z-10">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${getAvatarColor(student.id)}`}>
                        {getInitials(student.name)}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <GraduationCap size={16} /> BTS NDRC 2ème année
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleExportPDF}
                                className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
                            >
                                <FileText size={14} /> PDF
                            </button>
                            <button
                                onClick={handleExportWord}
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 font-bold hover:bg-blue-100 flex items-center gap-1 transition-colors"
                            >
                                <FileText size={14} /> Word
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-8 z-10">
                    <div className="text-center">
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Moyenne</p>
                        <div className="text-4xl font-bold text-gray-800">{studentAverage || "--"}<span className="text-lg text-gray-400 font-normal">/20</span></div>
                    </div>
                    <div className="w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Fiches</p>
                        <div className="text-4xl font-bold text-indigo-600">{submissions.length}</div>
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="text-indigo-600" /> Évolution des Résultats
                    </h3>
                    <div className="h-64">
                        <Line data={lineData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Crosshair className="text-indigo-600" /> Profil de Compétences
                    </h3>
                    <div className="h-64">
                        <Radar data={radarData} options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 20 } } }} />
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                    <History className="text-gray-400" />
                    <h3 className="font-bold text-gray-900">Historique Détaillé des Évaluations</h3>
                </div>
                {/* ... (Existing Table) ... */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Intitulé</th>
                                <th className="px-6 py-4 text-center">Note</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allHistory.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Aucune évaluation enregistrée.</td></tr>
                            ) : (
                                allHistory.map((item: any) => {
                                    const grade = calculateGrade(item.ratings);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'final' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700'}`}>
                                                    {item.type === 'final' ? 'CCF Final' : 'Continu'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{item.title}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded font-bold ${parseFloat(grade || "0") >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {grade}/20
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => onEdit(item, item.type)}
                                                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Supprimer cette évaluation définitivement ?')) onDelete(item.id, item.type);
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submissions Section (Teacher View) */}
            <StudentSubmissionsList studentId={student.id} />
        </div>
    );
}

function StudentSubmissionsList({ studentId }: { studentId: number }) {
    const [submissions, setSubmissions] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchSubs = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: any = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // Try fetching from the main tracking endpoint first
                const res = await fetch(`${API_URL}/api/tracking/submissions?student_id=${studentId}`, { headers });

                if (res.ok) {
                    const data = await res.json();
                    // Identify correct data structure: if filtered by quit param, it returns filtered array.
                    // If it returns all, filter manually.
                    if (Array.isArray(data)) {
                        setSubmissions(data.filter((s: any) => s.student_id === studentId));
                    }
                } else {
                    // Fallback to legacy endpoint if tracking fails
                    const oldRes = await fetch(`${API_URL}/api/submissions/${studentId}`);
                    if (oldRes.ok) {
                        const data = await oldRes.json();
                        setSubmissions(data);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchSubs();
    }, [studentId]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="text-indigo-600" />
                    <h3 className="font-bold text-gray-900">Documents remis par l'étudiant</h3>
                </div>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{submissions.length}</span>
            </div>

            <div className="p-6 grid gap-4 md:grid-cols-2">
                {submissions.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                        <div className="bg-gray-50 p-4 rounded-full inline-block text-gray-400 mb-3">
                            <FileText size={24} />
                        </div>
                        <p className="text-gray-400 font-medium">Aucun document déposé pour le moment.</p>
                    </div>
                ) : (
                    submissions.map(sub => (
                        <div key={sub.id || Math.random()} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{sub.deadline_title || sub.title || 'Document sans titre'}</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide ${sub.submission_type === 'E4_SITUATION' ? 'bg-purple-100 text-purple-700' :
                                                sub.submission_type === 'E6_CR' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {sub.submission_type === 'E4_SITUATION' ? 'E4' :
                                                sub.submission_type === 'E6_CR' ? 'E6' : 'Autre'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {sub.submitted_at || sub.date ? new Date(sub.submitted_at || sub.date).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                </div>
                                {sub.grade !== null && sub.grade !== undefined && (
                                    <span className={`font-bold text-sm px-2 py-1 rounded ${parseFloat(sub.grade) >= 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {sub.grade}/20
                                    </span>
                                )}
                            </div>

                            {sub.feedback && (
                                <div className="bg-yellow-50 p-3 rounded-lg mb-3 text-sm text-yellow-800 border border-yellow-100 text-xs">
                                    <span className="font-bold block text-[10px] uppercase mb-1 text-yellow-600">Feedback Professeur</span>
                                    {sub.feedback}
                                </div>
                            )}

                            {sub.content && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-3 line-clamp-3 italic">
                                    "{sub.content}"
                                </div>
                            )}

                            <div className="mt-auto pt-3 border-t border-gray-50 flex gap-2">
                                {sub.file_url ? (
                                    <a
                                        href={`${API_URL}${sub.file_url}`}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        <Monitor size={16} /> Télécharger
                                    </a>
                                ) : (
                                    <button disabled className="w-full bg-gray-100 text-gray-400 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                                        <FileText size={16} /> Pas de fichier
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
