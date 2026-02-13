import React, { useState, useEffect } from 'react';
import {
    User, FileText, Upload, Plus, Trash2, CheckCircle, Clock, ArrowLeft, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StudentPortalProps {
    students: any[];
    onBack: () => void;
    currentUser: any; // { id, name, role }
}

export default function StudentPortal({ students, onBack, currentUser }: StudentPortalProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(currentUser.id);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [newSubmission, setNewSubmission] = useState({ title: '', content: '', type: 'E4_SITUATION' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        // Auto select current user
        if (currentUser && currentUser.id) {
            setSelectedStudentId(currentUser.id);
            fetchSubmissions(currentUser.id);
        }
    }, [currentUser]);

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

    const handleChangePassword = async () => {
        const oldPass = prompt("Entrez votre code actuel :");
        if (!oldPass) return;
        const newPass = prompt("Entrez votre NOUVEAU code (4 chiffres) :");
        if (!newPass) return;
        if (newPass.length !== 4) { alert("Le code doit faire 4 caractères !"); return; }

        try {
            const res = await fetch(`${API_URL}/api/auth/student/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: currentUser.id,
                    old_password: oldPass,
                    new_password: newPass
                })
            });

            if (res.ok) alert("Code modifié avec succès !");
            else alert("Erreur : Ancien code incorrect.");
        } catch (e) { alert("Erreur connexion"); }
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

    // --- AI Helper Logic ---
    const [showAIHelper, setShowAIHelper] = useState(false);
    const [aiContext, setAiContext] = useState('');
    const [aiGeneratedContent, setAiGeneratedContent] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const handleGenerateAI = async () => {
        if (!aiContext) return;
        setAiLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            // Call backend to generate content based on context
            // Reuse the course generation endpoint but tweak for student fiche?
            // Or use a simple prompt.
            // Let's assume a new endpoint or use the existing one with specific prompt
            const response = await fetch(`${API_URL}/api/course`, { // Using course gen as proxy for text gen
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: `Rédige une fiche E4 de BTS NDRC professionnelle et détaillée sur ce contexte : ${aiContext}. Structure : Contexte, Objectifs, Déroulement, Résultats.`,
                    document_type: 'simple_text', // Backend needs to handle this or valid type
                    category: 'NDRC',
                    duration_hours: 1
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAiGeneratedContent(data.content);
            } else {
                alert("Erreur lors de la génération");
            }
        } catch (e) {
            console.error(e);
            alert("Erreur technique");
        } finally {
            setAiLoading(false);
        }
    };

    const useAiContent = () => {
        setNewSubmission({ ...newSubmission, content: aiGeneratedContent, title: "Fiche générée par IA" });
        setShowAIHelper(false);
        setShowForm(true);
    };

    if (showAIHelper) {
        return (
            <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
                <button onClick={() => setShowAIHelper(false)} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition-colors">
                    <ArrowLeft size={18} /> Retour
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Sparkles /> Assistant IA - Rédaction Fiche E4
                        </h2>
                        <p className="text-indigo-100 mt-2">Décrivez votre situation, l'IA rédige la fiche pour vous.</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contexte de la situation</label>
                            <textarea
                                value={aiContext}
                                onChange={e => setAiContext(e.target.value)}
                                className="w-full p-4 border border-gray-200 rounded-xl h-40 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ex: J'ai vendu un contrat d'assurance vie à un client difficile..."
                            />
                        </div>

                        <button
                            onClick={handleGenerateAI}
                            disabled={aiLoading || !aiContext}
                            className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-all ${aiLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {aiLoading ? 'Rédaction en cours...' : 'Générer la Fiche'}
                        </button>

                        {aiGeneratedContent && (
                            <div className="animate-slide-up mt-6">
                                <h3 className="font-bold text-gray-800 mb-2">Proposition de l'IA :</h3>
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {aiGeneratedContent}
                                </div>
                                <div className="mt-4 flex gap-4">
                                    <button
                                        onClick={useAiContent}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
                                    >
                                        Utiliser ce contenu
                                    </button>
                                    <button
                                        onClick={() => setAiGeneratedContent('')}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                                    >
                                        Ignorer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAIHelper(true)}
                                className="bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-purple-200 transition-colors"
                            >
                                <Sparkles size={18} /> Aide IA
                            </button>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors"
                            >
                                <Plus size={18} /> Nouveau Dépôt
                            </button>
                        </div>
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

                {/* Section Compte */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <User className="text-purple-600" /> Mon Compte
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Code Personnel de Connexion</p>
                            <p className="text-sm text-gray-500">Utilisez ce code pour vous connecter à votre espace.</p>
                        </div>
                        <button
                            onClick={handleChangePassword}
                            className="text-purple-600 font-bold border border-purple-100 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                        >
                            Modifier mon code
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
