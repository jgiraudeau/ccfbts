import React, { useState, useEffect } from 'react';
import {
    User, FileText, Upload, Plus, Trash2, CheckCircle, Clock, ArrowLeft, Sparkles, X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StudentPortalProps {
    students: any[];
    onBack: () => void;
    currentUser: any; // { id, name, role }
    defaultType?: string; // Optional default type for the form
}

export default function StudentPortal({ students, onBack, currentUser, defaultType }: StudentPortalProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(currentUser.id);
    const [submissions, setSubmissions] = useState<any[]>([]);
    // Changed state: content -> message (optional note), added text for title, file for file upload.
    const [newSubmission, setNewSubmission] = useState<{
        title: string;
        message: string;
        type: string;
        file: File | null;
    }>({
        title: '',
        message: '',
        type: defaultType || 'E4_SITUATION',
        file: null
    });
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Auto select current user
        if (currentUser && currentUser.id) {
            setSelectedStudentId(currentUser.id);
            fetchSubmissions(currentUser.id);
        }
    }, [currentUser]);

    // Fetch submissions using the tracking/submissions endpoint filtered by student (or generic submissions endpoint if that's preferred, 
    // but we want to stay in sync with the dashboard). 
    // Assuming GET /api/tracking/submissions returns ALL, we might need to filter client side or use a student-specific endpoint if available.
    // The previous code used /api/submissions/{id}, let's stick to that for FETCHING if it works, 
    // OR try to align with the Dashboard's source. 
    // Dashboard: GET /api/tracking/submissions. 
    // Let's try to use the same pattern as the Dashboard to ensure we see the same things.
    const fetchSubmissions = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/tracking/submissions?student_id=${id}`, { // Assuming an optional filter query param exists or we filter client side
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Fallback if specific filtering endpoint doesn't exist: fetch all and filter client side
            if (res.ok) {
                const data = await res.json();
                // If the API returns all submissions, filter for this student
                if (Array.isArray(data)) {
                    setSubmissions(data.filter((s: any) => s.student_id === id));
                }
            } else {
                // Fallback to old endpoint if tracking fails (compatibility)
                const oldRes = await fetch(`${API_URL}/api/submissions/${id}`);
                if (oldRes.ok) {
                    const data = await oldRes.json();
                    setSubmissions(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch submissions", e);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewSubmission({ ...newSubmission, file: e.target.files[0] });
        }
    };

    const handleSubmit = async () => {
        if (!selectedStudentId || !newSubmission.title || !newSubmission.file) {
            alert("Veuillez remplir le titre et sélectionner un fichier.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('student_id', selectedStudentId.toString());
            formData.append('title', newSubmission.title);
            formData.append('submission_type', newSubmission.type); // Enforce type
            formData.append('file', newSubmission.file); // The file object
            if (newSubmission.message) {
                formData.append('feedback', newSubmission.message); // Using 'feedback' or 'comment' - let's try to map to what backend might expect. Usually 'description' or just implied. 
                // Wait, TeacherDashboard uses 'feedback' for TEACHER feedback.
                // Let's assume the backend might accept a 'message' or 'description' field, or we just rely on the file and title.
                // Actually, the previous code sent 'content'. Let's keep sending 'content' as the notes.
                formData.append('content', newSubmission.message);
            }
            // Add date just in case
            formData.append('submitted_at', new Date().toISOString());

            const token = localStorage.getItem('token');
            // Using /api/tracking/submissions for POST to align with Dashboard read
            const res = await fetch(`${API_URL}/api/tracking/submissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type is set automatically with FormData
                },
                body: formData
            });

            if (res.ok) {
                fetchSubmissions(selectedStudentId);
                setShowForm(false);
                setNewSubmission({ title: '', message: '', type: 'E4_SITUATION', file: null });
                alert("Document déposé avec succès ! 📂");
            } else {
                alert("Erreur lors du dépôt du fichier.");
                console.error(await res.text());
            }
        } catch (e) {
            console.error("Failed to submit", e);
            alert("Erreur technique lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer ce document ?")) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/tracking/submissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
                {/* Login View - Same as before */}
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

    // AI Helper (kept simple for text generation, could be adapted to export file later)
    // For now, if user uses AI, we can put the text into the "message" or "note" field, 
    // BUT user still needs to upload a PDF/Word as per request. 
    // Or we could let them save the AI content as a .txt file dynamically? 
    // Let's keep it simple: AI fills the "message" part, but file is mandatory.

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
                            <Upload className="text-indigo-600" />
                            {defaultType === 'E4_SITUATION' ? 'Mes Fiches E4 (Négociation)' :
                                defaultType === 'E6_CR' ? 'Mes Fiches Animation Commerciale' :
                                    'Mes Dépôts (Fiches & Dossiers)'}
                        </h2>
                        <div className="flex gap-2">
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
                            <h3 className="font-bold text-gray-800 mb-4">
                                Déposer un nouveau document {defaultType === 'E4_SITUATION' ? 'E4' : defaultType === 'E6_CR' ? 'Animation Commerciale' : ''}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Titre du document <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={newSubmission.title}
                                        onChange={e => setNewSubmission({ ...newSubmission, title: e.target.value })}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: Fiche Situation Négociation Client X"
                                    />
                                </div>

                                {!defaultType && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Type de document</label>
                                        <select
                                            value={newSubmission.type}
                                            onChange={e => setNewSubmission({ ...newSubmission, type: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="E4_SITUATION">Fiche Situation E4 (Négociation)</option>
                                            <option value="E6_CR">Fiche Animation Commerciale</option>
                                            <option value="AUTRE">Autre Document / Preuve</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Fichier (Word ou PDF) <span className="text-red-500">*</span></label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload size={24} className="mb-2 text-indigo-400" />
                                        {newSubmission.file ? (
                                            <span className="font-medium text-indigo-600">{newSubmission.file.name}</span>
                                        ) : (
                                            <span>Cliquez pour sélectionner un fichier</span>
                                        )}
                                        <span className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX acceptés</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Message / Note (Optionnel)</label>
                                    <textarea
                                        value={newSubmission.message}
                                        onChange={e => setNewSubmission({ ...newSubmission, message: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Petite note pour le professeur..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le document'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {submissions.filter(s => !defaultType || s.submission_type === defaultType).length === 0 ? (
                            <p className="text-gray-400 italic col-span-2 text-center py-8">Aucun document déposé pour cette catégorie.</p>
                        ) : (
                            submissions.filter(s => !defaultType || s.submission_type === defaultType).map(sub => (
                                <div key={sub.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start group hover:border-indigo-200 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-3 rounded-lg ${sub.submission_type === 'E4_SITUATION' ? 'bg-purple-50 text-purple-600' :
                                            sub.submission_type === 'E6_CR' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{sub.deadline_title || sub.title || 'Document sans titre'}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    {sub.submission_type === 'E4_SITUATION' ? 'Fiche E4' :
                                                        sub.submission_type === 'E6_CR' ? 'Fiche Animation Co.' : 'Autre'}
                                                </span>
                                                {sub.grade !== null && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                                        Note: {sub.grade}/20
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {sub.submitted_at || sub.date ? new Date(sub.submitted_at || sub.date).toLocaleDateString() : 'Date inconnue'}
                                                {sub.file_name && <span className="block mt-1 text-gray-400 italic">📎 {sub.file_name}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {/* Download button if file exists */}
                                        {sub.file_url && (
                                            <a
                                                href={`${API_URL}${sub.file_url}`}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-indigo-600 p-1"
                                                title="Télécharger"
                                            >
                                                <Upload size={18} className="rotate-180" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
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
