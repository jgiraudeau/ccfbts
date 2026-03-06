"use client";
import React, { useState, useEffect } from 'react';
import {
    User, FileText, Upload, Plus, Trash2, BarChart2,
    Calendar, Bell, BookOpen, Star, ChevronRight,
    CheckCircle2, Clock, AlertTriangle, Award, TrendingUp, LogOut
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Tab = 'home' | 'evaluations' | 'fiches' | 'account';

const DOMAIN_LABELS: Record<string, string> = {
    E6_DISTRIBUTION: "Implanter & Promouvoir (Distributeur)",
    E6_PARTENARIAT: "Développer un réseau de partenaires",
    E6_VD: "Créer & Animer un réseau de vente directe",
    E4_CIBLER_PROSPECTER: "Cibler & Prospecter",
    E4_NEGOCIER: "Négociation-Vente",
    E4_EVENEMENT: "Événement Commercial",
    E4_INFO: "Information Commerciale",
};

const RATING_VALUES: Record<string, number> = { TI: 5, I: 10, S: 15, TS: 20 };
const RATING_COLORS: Record<string, string> = {
    TI: "bg-red-100 text-red-700 border border-red-200",
    I: "bg-orange-100 text-orange-700 border border-orange-200",
    S: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    TS: "bg-blue-100 text-blue-700 border border-blue-200",
};
const RATING_FULL: Record<string, string> = {
    TI: "Très Insuffisant",
    I: "Insuffisant",
    S: "Satisfaisant",
    TS: "Très Satisfaisant",
};

interface StudentPortalProps {
    students: any[];
    onBack: () => void;
    currentUser: any;
    defaultType?: string;
}

export default function StudentPortal({ students, onBack, currentUser, defaultType }: StudentPortalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [myEvaluations, setMyEvaluations] = useState<any[]>([]);
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newSubmission, setNewSubmission] = useState({
        title: '', message: '', type: defaultType || 'E4_SITUATION', file: null as File | null,
    });

    const studentId = currentUser?.id;

    useEffect(() => {
        if (!studentId) return;
        fetchAll();
    }, [studentId]);

    const fetchAll = async () => {
        const token = localStorage.getItem('token');
        const headers: any = { 'Authorization': `Bearer ${token}` };

        // Fiches / soumissions
        try {
            const res = await fetch(`${API_URL}/api/submissions/${studentId}`);
            if (res.ok) setSubmissions(await res.json());
        } catch (e) { console.error(e); }

        // Évaluations prépa (sans CCF)
        try {
            const res = await fetch(`${API_URL}/api/evaluations/my`, { headers });
            if (res.ok) setMyEvaluations(await res.json());
        } catch (e) { console.error(e); }

        // Échéances
        try {
            const res = await fetch(`${API_URL}/api/deadlines`, { headers });
            if (res.ok) setDeadlines(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setNewSubmission(prev => ({ ...prev, file: e.target.files![0] }));
    };

    const handleSubmit = async () => {
        if (!studentId || !newSubmission.title || !newSubmission.file) {
            alert("Veuillez remplir le titre et sélectionner un fichier.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', newSubmission.file);
            const uploadRes = await fetch(`${API_URL}/api/tracking/submissions/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
            });
            if (!uploadRes.ok) { alert("Erreur lors de l'upload."); return; }
            const uploadData = await uploadRes.json();

            const res = await fetch(`${API_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    student_id: studentId,
                    title: newSubmission.title,
                    content: newSubmission.message || "",
                    submission_type: newSubmission.type,
                    date: new Date().toISOString().split('T')[0],
                    file_url: uploadData.file_url,
                    file_name: uploadData.file_name,
                }),
            });
            if (res.ok) {
                fetchAll();
                setShowUploadForm(false);
                setNewSubmission({ title: '', message: '', type: 'E4_SITUATION', file: null });
                alert("Document déposé avec succès ! 📂");
            } else {
                alert("Erreur lors du dépôt.");
            }
        } catch (e) {
            alert("Erreur technique.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer ce document ?")) return;
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/tracking/submissions/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchAll();
    };

    const handleChangePassword = async () => {
        const oldPass = prompt("Entrez votre code actuel :");
        if (!oldPass) return;
        const newPass = prompt("Entrez votre NOUVEAU code (4 chiffres) :");
        if (!newPass || newPass.length !== 4) { alert("Le code doit faire 4 caractères !"); return; }
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/auth/student/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ student_id: studentId, old_password: oldPass, new_password: newPass }),
        });
        if (res.ok) alert("Code modifié avec succès !");
        else alert("Erreur : Ancien code incorrect.");
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Supprimer votre compte et TOUTES vos données ? Cette action est irréversible.")) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/auth/my-account`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) { localStorage.removeItem('token'); alert("Compte supprimé."); onBack(); }
        else alert("Erreur lors de la suppression.");
    };

    // ─── Computed stats ──────────────────────────────────────────────
    const evalAvg = myEvaluations.length > 0 ? (() => {
        const allVals = myEvaluations.flatMap(ev =>
            Object.values(ev.ratings || {}).map((r: any) => RATING_VALUES[r] || 0)
        );
        return allVals.length > 0 ? (allVals.reduce((a, b) => a + b, 0) / allVals.length) : 0;
    })() : null;

    const fichesWithGrade = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    const ficheAvg = fichesWithGrade.length > 0
        ? fichesWithGrade.reduce((a, s) => a + parseFloat(s.grade), 0) / fichesWithGrade.length
        : null;

    const today = new Date();
    const upcomingDeadlines = deadlines
        .filter(d => new Date(d.due_date) >= today)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    const pastDueDeadlines = deadlines
        .filter(d => new Date(d.due_date) < today)
        .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

    // ─── TABS CONFIG ─────────────────────────────────────────────────
    const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
        { id: 'home', label: 'Accueil', icon: BookOpen },
        { id: 'evaluations', label: 'Mes Évaluations', icon: BarChart2, badge: myEvaluations.length || undefined },
        { id: 'fiches', label: 'Mes Fiches', icon: FileText, badge: submissions.length || undefined },
        { id: 'account', label: 'Mon Compte', icon: User },
    ];

    const currentStudent = students.find(s => s.id === studentId);

    // ─── RENDER ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* HEADER */}
            <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    {/* Identité élève */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {currentStudent?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">{currentStudent?.name || 'Élève'}</p>
                            <p className="text-xs text-indigo-600 font-medium">BTS NDRC 2ème année</p>
                        </div>
                    </div>
                    {/* Notifications & déconnexion */}
                    <div className="flex items-center gap-3">
                        {upcomingDeadlines.length > 0 && (
                            <button
                                onClick={() => setActiveTab('home')}
                                className="relative p-2.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                title={`${upcomingDeadlines.length} échéances à venir`}
                            >
                                <Bell size={20} />
                                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {upcomingDeadlines.length}
                                </span>
                            </button>
                        )}
                        <div className="w-px h-8 bg-gray-200"></div>
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Déconnexion</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* NAVIGATION TABS */}
            <div className="bg-white border-b border-gray-100 sticky top-[61px] z-30">
                <nav className="max-w-3xl mx-auto flex overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-1 justify-center ${isActive
                                        ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.badge !== undefined && (
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* CONTENT */}
            <main className="max-w-3xl mx-auto px-4 py-6 pb-20">

                {/* ── TAB: ACCUEIL ── */}
                {activeTab === 'home' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Stats cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                    <BarChart2 size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Moy. Évals</span>
                                </div>
                                <div className={`text-3xl font-bold ${evalAvg && evalAvg >= 10 ? 'text-emerald-600' : evalAvg ? 'text-red-600' : 'text-gray-300'}`}>
                                    {evalAvg ? `${evalAvg.toFixed(1)}` : '--'}
                                    {evalAvg && <span className="text-base font-normal text-gray-400">/20</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{myEvaluations.length} évaluation{myEvaluations.length > 1 ? 's' : ''}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 text-purple-600 mb-2">
                                    <FileText size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Moy. Fiches</span>
                                </div>
                                <div className={`text-3xl font-bold ${ficheAvg && ficheAvg >= 10 ? 'text-emerald-600' : ficheAvg ? 'text-red-600' : 'text-gray-300'}`}>
                                    {ficheAvg ? `${ficheAvg.toFixed(1)}` : '--'}
                                    {ficheAvg && <span className="text-base font-normal text-gray-400">/20</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{submissions.length} fiche{submissions.length > 1 ? 's' : ''} déposée{submissions.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        {/* Échéances à venir */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Calendar className="text-orange-500" size={18} />
                                    Prochaines Échéances
                                </h2>
                                <span className="text-xs text-gray-400">{upcomingDeadlines.length} à venir</span>
                            </div>
                            {upcomingDeadlines.length === 0 ? (
                                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-300" />
                                    Aucune échéance à venir 🎉
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {upcomingDeadlines.slice(0, 5).map(dl => {
                                        const daysLeft = Math.ceil((new Date(dl.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        const isUrgent = daysLeft <= 3;
                                        return (
                                            <li key={dl.id} className="px-5 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 p-1.5 rounded-lg ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {isUrgent ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{dl.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {dl.exam_type && <span className="font-medium text-indigo-500 mr-1">{dl.exam_type}</span>}
                                                            {dl.document_type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`text-xs font-bold px-2 py-1 rounded-full ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {daysLeft === 0 ? "Aujourd'hui !" : daysLeft === 1 ? 'Demain' : `J-${daysLeft}`}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(dl.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Dernières évals */}
                        {myEvaluations.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <TrendingUp className="text-indigo-500" size={18} />
                                        Dernières Évaluations
                                    </h2>
                                    <button onClick={() => setActiveTab('evaluations')} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                        Tout voir <ChevronRight size={12} />
                                    </button>
                                </div>
                                <ul className="divide-y divide-gray-50">
                                    {myEvaluations.slice(0, 3).map((ev: any) => {
                                        const vals = Object.values(ev.ratings || {}).map((r: any) => RATING_VALUES[r] || 0);
                                        const avg = vals.length > 0 ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
                                        return (
                                            <li key={ev.id} className="px-5 py-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{DOMAIN_LABELS[ev.domainId] || ev.domainId}</p>
                                                    <p className="text-xs text-gray-400">{ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : ''}</p>
                                                </div>
                                                <span className={`font-bold text-lg ${avg >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {avg.toFixed(1)}<span className="text-xs text-gray-400 font-normal">/20</span>
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* Échéances passées */}
                        {pastDueDeadlines.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-600 text-sm flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        Échéances passées
                                    </h2>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    {pastDueDeadlines.slice(0, 3).map(dl => (
                                        <li key={dl.id} className="px-5 py-3 flex justify-between items-center opacity-60">
                                            <p className="text-sm text-gray-600 line-through">{dl.title}</p>
                                            <p className="text-xs text-gray-400">{new Date(dl.due_date).toLocaleDateString('fr-FR')}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: ÉVALUATIONS ── */}
                {activeTab === 'evaluations' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-lg">
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Moyenne générale évaluations prépa</p>
                            <div className="text-4xl font-bold">{evalAvg ? `${evalAvg.toFixed(1)}/20` : '--/20'}</div>
                            <p className="text-indigo-200 text-xs mt-1">{myEvaluations.length} évaluation{myEvaluations.length > 1 ? 's' : ''} enregistrée{myEvaluations.length > 1 ? 's' : ''} · Notes CCF non incluses</p>
                        </div>

                        {myEvaluations.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 text-gray-400">
                                <BarChart2 size={40} className="mx-auto mb-3 text-gray-200" />
                                <p className="font-semibold">Aucune évaluation enregistrée</p>
                                <p className="text-sm mt-1">Vos évaluations préparatoires apparaîtront ici une fois saisies par votre professeur.</p>
                            </div>
                        ) : (
                            myEvaluations.map((ev: any) => {
                                const vals = Object.values(ev.ratings || {}).map((r: any) => RATING_VALUES[r] || 0);
                                const avg = vals.length > 0 ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
                                const isE4 = ev.domainId?.startsWith('E4');
                                return (
                                    <div key={ev.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        {/* Header */}
                                        <div className={`flex items-center justify-between px-5 py-4 ${isE4 ? 'bg-purple-50 border-b border-purple-100' : 'bg-indigo-50 border-b border-indigo-100'}`}>
                                            <div>
                                                <h3 className={`font-bold text-sm ${isE4 ? 'text-purple-800' : 'text-indigo-800'}`}>
                                                    {DOMAIN_LABELS[ev.domainId] || ev.domainId || 'Évaluation'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isE4 ? 'bg-purple-200 text-purple-700' : 'bg-indigo-200 text-indigo-700'}`}>
                                                        {isE4 ? 'E4' : 'E6'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${avg >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {avg.toFixed(1)}<span className="text-sm font-normal text-gray-400">/20</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Appréciations par compétence */}
                                        <div className="px-5 py-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Appréciations par compétence</p>
                                            <div className="space-y-2">
                                                {Object.entries(ev.ratings || {}).map(([skillId, rating]: [string, any]) => (
                                                    <div key={skillId} className="flex items-center justify-between gap-2">
                                                        <span className="text-xs text-gray-600 flex-1 truncate">{skillId}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${RATING_COLORS[rating] || 'bg-gray-100 text-gray-600'}`}>
                                                                {rating} — {RATING_FULL[rating]}
                                                            </span>
                                                            <span className="text-xs text-gray-400 w-8 text-right">{RATING_VALUES[rating]}/20</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Commentaire professeur */}
                                        {ev.comment && (
                                            <div className="mx-5 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">💬 Commentaire du professeur</p>
                                                <p className="text-sm text-amber-900 italic">{ev.comment}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ── TAB: MES FICHES ── */}
                {activeTab === 'fiches' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Bouton nouveau dépôt */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-gray-900">Documents déposés</h2>
                                {ficheAvg && (
                                    <p className="text-xs text-gray-500">Moyenne fiches notées : <span className={`font-bold ${ficheAvg >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>{ficheAvg.toFixed(1)}/20</span></p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowUploadForm(!showUploadForm)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 text-sm"
                            >
                                <Plus size={16} /> Nouveau dépôt
                            </button>
                        </div>

                        {/* Formulaire envoi */}
                        {showUploadForm && (
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 animate-slide-up">
                                <h3 className="font-bold text-gray-800 mb-4">Déposer un document</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Titre <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newSubmission.title}
                                            onChange={e => setNewSubmission({ ...newSubmission, title: e.target.value })}
                                            className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="Ex: Fiche Situation Négociation - Entreprise X"
                                        />
                                    </div>
                                    {!defaultType && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Type de document</label>
                                            <select
                                                value={newSubmission.type}
                                                onChange={e => setNewSubmission({ ...newSubmission, type: e.target.value })}
                                                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            >
                                                <option value="E4_SITUATION">Fiche Situation E4 (Négociation)</option>
                                                <option value="E6_CR">Fiche Animation Commerciale (E6)</option>
                                                <option value="AUTRE">Autre Document / Preuve</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Fichier <span className="text-red-500">*</span></label>
                                        <div className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center hover:bg-indigo-50 transition-colors cursor-pointer relative">
                                            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.odt,.rtf,.txt,.xls,.xlsx,.pptx" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <Upload size={22} className="mx-auto mb-2 text-indigo-400" />
                                            {newSubmission.file
                                                ? <p className="text-indigo-700 font-semibold text-sm">{newSubmission.file.name}</p>
                                                : <p className="text-gray-500 text-sm">Cliquez pour sélectionner</p>}
                                            <p className="text-xs text-gray-400 mt-1">PDF, Word, Images, Excel, PowerPoint acceptés</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Note pour le prof (optionnel)</label>
                                        <textarea
                                            value={newSubmission.message}
                                            onChange={e => setNewSubmission({ ...newSubmission, message: e.target.value })}
                                            className="w-full p-2.5 border border-gray-200 rounded-xl h-20 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                                            placeholder="Un commentaire à transmettre..."
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowUploadForm(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 text-sm">Annuler</button>
                                        <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-sm">
                                            {isSubmitting ? 'Envoi...' : 'Envoyer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Liste fiches */}
                        {submissions.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 text-gray-400">
                                <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                                <p className="font-semibold">Aucun document déposé</p>
                                <p className="text-sm mt-1">Déposez vos fiches E4/E6 pour les soumettre à votre professeur.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {submissions.map(sub => (
                                    <div key={sub.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-indigo-200 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`p-2.5 rounded-xl shrink-0 ${sub.submission_type === 'E4_SITUATION' ? 'bg-purple-100 text-purple-600' :
                                                        sub.submission_type === 'E6_CR' ? 'bg-indigo-100 text-indigo-600' :
                                                            'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 text-sm truncate">{sub.deadline_title || sub.title || 'Document'}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                            {sub.submission_type === 'E4_SITUATION' ? 'Fiche E4' : sub.submission_type === 'E6_CR' ? 'Fiche E6' : 'Autre'}
                                                        </span>
                                                        {sub.grade !== null && sub.grade !== undefined && (
                                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${parseFloat(sub.grade) >= 10 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                                ⭐ {sub.grade}/20
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            {sub.submitted_at || sub.date ? new Date(sub.submitted_at || sub.date).toLocaleDateString('fr-FR') : ''}
                                                        </span>
                                                    </div>
                                                    {sub.file_name && <p className="text-[10px] text-gray-400 mt-1 truncate">📎 {sub.file_name}</p>}
                                                    {sub.feedback && (
                                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">💬 Feedback prof</p>
                                                            <p className="text-xs text-amber-800">{sub.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                {sub.file_url && (
                                                    <a
                                                        href={`${API_URL}${sub.file_url}`}
                                                        download target="_blank" rel="noreferrer"
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Télécharger"
                                                    >
                                                        <Upload size={16} className="rotate-180" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(sub.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Toutes les échéances */}
                        {deadlines.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                                <div className="px-5 py-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                                        <Calendar className="text-orange-500" size={16} />
                                        Toutes les Échéances
                                    </h3>
                                </div>
                                <ul className="divide-y divide-gray-50">
                                    {deadlines.map(dl => {
                                        const daysLeft = Math.ceil((new Date(dl.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        const isPast = daysLeft < 0;
                                        const isUrgent = !isPast && daysLeft <= 3;
                                        return (
                                            <li key={dl.id} className={`px-5 py-3.5 flex justify-between items-center ${isPast ? 'opacity-50' : ''}`}>
                                                <div>
                                                    <p className={`font-semibold text-sm ${isPast ? 'line-through text-gray-400' : 'text-gray-800'}`}>{dl.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {dl.exam_type && <span className="text-indigo-500 font-medium mr-1">{dl.exam_type}</span>}
                                                        {dl.document_type}
                                                        {dl.is_mandatory && <span className="ml-1 text-red-500 font-bold">• Obligatoire</span>}
                                                    </p>
                                                    {dl.description && <p className="text-xs text-gray-400 mt-1 italic">{dl.description}</p>}
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    <p className={`text-xs font-bold px-2 py-1 rounded-full ${isPast ? 'bg-gray-100 text-gray-500' : isUrgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {isPast ? 'Passée' : daysLeft === 0 ? "Auj." : `J-${daysLeft}`}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(dl.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: MON COMPTE ── */}
                {activeTab === 'account' && (
                    <div className="space-y-5 animate-fade-in">
                        {/* Profil */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {currentStudent?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">{currentStudent?.name}</h3>
                                    <p className="text-gray-500 text-sm">BTS NDRC 2ème année</p>
                                    <p className="text-xs text-indigo-600 font-medium mt-0.5">Élève · ProfVirtuel</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-gray-400 text-xs mb-0.5">Fiches déposées</p>
                                    <p className="font-bold text-gray-900 text-lg">{submissions.length}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-gray-400 text-xs mb-0.5">Évals prépa</p>
                                    <p className="font-bold text-gray-900 text-lg">{myEvaluations.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sécurité */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <Award className="text-indigo-600" size={18} />
                                Sécurité du compte
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Code Personnel de Connexion</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Modifiez votre code d'accès espace élève.</p>
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    className="shrink-0 text-indigo-600 font-bold border border-indigo-100 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors text-sm"
                                >
                                    Modifier
                                </button>
                            </div>
                        </div>

                        {/* RGPD */}
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                            <h2 className="font-bold text-red-900 mb-1 text-sm">Supprimer mon compte</h2>
                            <p className="text-xs text-red-600 mb-4">Supprime votre compte et toutes vos données de manière irréversible (RGPD art. 17).</p>
                            <button
                                onClick={handleDeleteAccount}
                                className="text-red-600 font-bold border border-red-200 bg-white px-4 py-2 rounded-xl hover:bg-red-100 transition-colors text-sm"
                            >
                                Supprimer mon compte
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
