import React, { useState, useEffect } from 'react';
import {
    User, FileText, Upload, Plus, Trash2, CheckCircle, Clock
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StudentPortalProps {
    students: any[];
    onBack: () => void;
}

export default function StudentPortal({ students, onBack }: StudentPortalProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [newSubmission, setNewSubmission] = useState({ title: '', content: '', type: 'E4_SITUATION' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (selectedStudentId) {
            fetchSubmissions(selectedStudentId);
        }
    }, [selectedStudentId]);

    const fetchSubmissions = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/submissions/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (e) {
            console.error("Failed to fetch submissions", e);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStudentId || !newSubmission.title || !newSubmission.content) return;

        try {
            const res = await fetch(`${API_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: selectedStudentId,
                    title: newSubmission.title,
                    content: newSubmission.content,
                    submission_type: newSubmission.type,
                    date: new Date().toISOString().split('T')[0]
                })
            });

            if (res.ok) {
                fetchSubmissions(selectedStudentId);
                setShowForm(false);
                setNewSubmission({ title: '', content: '', type: 'E4_SITUATION' });
                alert("Document déposé avec succès !");
            }
        } catch (e) {
            console.error("Failed to submit", e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer ce document ?")) return;
        try {
            await fetch(`${API_URL}/api/submissions/${id}`, { method: 'DELETE' });
            if (selectedStudentId) fetchSubmissions(selectedStudentId);
        } catch (e) { console.error("Failed to delete", e); }
    };

    if (!selectedStudentId) {
        return (
            <div className="max-w-2xl mx-auto p-6 animate-fade-in">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Espace Élève - Connexion</h1>
                <div className="grid gap-4">
                    {students.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedStudentId(s.id)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all text-left"
                        >
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <User />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{s.name}</h3>
                                <p className="text-sm text-gray-500">Accéder à mon espace</p>
                            </div>
                        </button>
                    ))}
                </div>
                <button onClick={onBack} className="mt-8 text-gray-500 hover:text-indigo-600 w-full text-center">
                    Retour au menu professeur
                </button>
            </div>
        );
    }

    const currentStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bonjour, {currentStudent?.name}</h1>
                    <p className="text-gray-500">Espace de dépôt et de suivi</p>
                </div>
                <button onClick={() => setSelectedStudentId(null)} className="text-gray-500 hover:text-red-600 text-sm">
                    Déconnexion
                </button>
            </header>

            <div className="grid gap-8">
                {/* Section Dépôt */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Upload className="text-indigo-600" /> Mes Dépôts (Fiches & Dossiers)
                        </h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={18} /> Nouveau Dépôt
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 mb-6 animate-slide-up">
                            <h3 className="font-bold text-gray-800 mb-4">Déposer un nouveau document</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Titre du document</label>
                                    <input
                                        type="text"
                                        value={newSubmission.title}
                                        onChange={e => setNewSubmission({ ...newSubmission, title: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: Fiche Situation Négociation Client X"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Type de document</label>
                                    <select
                                        value={newSubmission.type}
                                        onChange={e => setNewSubmission({ ...newSubmission, type: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="E4_SITUATION">Fiche Situation E4 (Négociation)</option>
                                        <option value="E6_CR">Compte Rendu E6</option>
                                        <option value="AUTRE">Autre Document / Preuve</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Contenu (Copier-Coller le texte)</label>
                                    <textarea
                                        value={newSubmission.content}
                                        onChange={e => setNewSubmission({ ...newSubmission, content: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Collez ici le contenu de votre fiche ou décrire le document..."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Astuce : C'est ce contenu qui sera utilisé par le professeur pour générer votre sujet d'examen. Soyez précis !
                                    </p>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700"
                                >
                                    Enregistrer le document
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {submissions.length === 0 ? (
                            <p className="text-gray-400 italic col-span-2 text-center py-8">Aucun document déposé.</p>
                        ) : (
                            submissions.map(sub => (
                                <div key={sub.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start group hover:border-indigo-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{sub.title}</h4>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {sub.submission_type === 'E4_SITUATION' ? 'Fiche E4' : (sub.submission_type === 'E6_CR' ? 'CR E6' : 'Autre')}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-2">Déposé le {sub.date}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
