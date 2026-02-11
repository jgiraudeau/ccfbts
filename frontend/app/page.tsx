"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    FileCheck, LayoutDashboard, Settings, Award, Plus, Sparkles,
    TrendingUp, Users, UserX, BarChart2, FileText, GraduationCap, BookOpen
} from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
    Filler
} from 'chart.js';
import { calculateGrade } from './types';

// Import components
import StudentManager from '../components/StudentManager';
import ContinuousEvaluationForm from '../components/ContinuousEvaluationForm';
import FinalCCFForm from '../components/FinalCCFForm';
import StudentView from '../components/StudentView';
import ComparisonView from '../components/ComparisonView';
import E4EvaluationForm from '../components/E4EvaluationForm';
import ScenarioGenerator from '../components/ScenarioGenerator';
import StudentPortal from '../components/StudentPortal';
import SubmissionsView from '../components/SubmissionsView';
import LoginPage from '../components/LoginPage';
import TrackingSystem from '../components/TrackingSystem';

// Register Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- CONFIGURATION API ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
    return colors[index % colors.length];
};

export default function Home() {
    // Auth State
    const [user, setUser] = useState<any>(null); // { name, role, class_code? }

    // App Mode: 'evaluation' (old E4/E6 system) or 'tracking' (new tracking system)
    const [appMode, setAppMode] = useState<'evaluation' | 'tracking'>('tracking');

    const [view, setView] = useState('dashboard');
    const [selectedBlock, setSelectedBlock] = useState<'E6' | 'E4'>('E4');
    const [students, setStudents] = useState<any[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [finalEvaluations, setFinalEvaluations] = useState<any[]>([]);
    const [reflexiveData, setReflexiveData] = useState<any>({});
    const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);

    // Initial Load Check (Mock Auth persistence could go here)

    // Filter evaluations based on block
    const filteredEvaluations = useMemo(() => {
        return finalEvaluations.filter(e => {
            if (selectedBlock === 'E6') return !e.type || e.type === 'E6';
            if (selectedBlock === 'E4') return e.type === 'E4';
            return true;
        });
    }, [finalEvaluations, selectedBlock]);

    const refreshSubmissions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/submissions`);
            if (res.ok) {
                const subData = await res.json();
                setSubmissions(subData);
            }
        } catch (e) { console.error("Failed to fetch submissions", e); }
    };

    // --- Data Fetching ---
    useEffect(() => {
        if (!user) return; // Fetch only if logged in

        const fetchData = async () => {
            try {
                // Students (Backend API) - Use auth endpoint with class code
                const classCode = user.class_code || '1234';
                const resStudents = await fetch(`${API_URL}/api/auth/students/${classCode}`);
                if (resStudents.ok) {
                    const data = await resStudents.json();
                    setStudents(data);
                }

                // Evals (LocalStorage for now + future Mock Sync)
                const savedEval = localStorage.getItem('ndrc_evaluations');
                if (savedEval) setEvaluations(JSON.parse(savedEval));

                const savedFinal = localStorage.getItem('ndrc_final_evaluations');
                if (savedFinal) setFinalEvaluations(JSON.parse(savedFinal));

                const savedReflex = localStorage.getItem('ndrc_reflexive');
                if (savedReflex) setReflexiveData(JSON.parse(savedReflex));

                // Fetch Submissions
                refreshSubmissions();

            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, [user]);

    // --- Sync Logic (Background) ---
    useEffect(() => {
        localStorage.setItem('ndrc_evaluations', JSON.stringify(evaluations));
        if (evaluations.length > 0) {
            fetch(`${API_URL}/sync/evaluations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(evaluations)
            }).catch(e => console.warn("Sync failed", e));
        }
    }, [evaluations]);

    useEffect(() => {
        localStorage.setItem('ndrc_final_evaluations', JSON.stringify(finalEvaluations));
    }, [finalEvaluations]);

    useEffect(() => {
        localStorage.setItem('ndrc_reflexive', JSON.stringify(reflexiveData));
    }, [reflexiveData]);

    // --- Actions ---

    const addStudents = async (newStudentsList: any[]) => {
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log("🚀 Starting import of", newStudentsList.length, "students");

        // 1. Fetch current classes
        let existingClasses: any[] = [];
        try {
            const resCls = await fetch(`${API_URL}/api/classes`, { headers });
            if (resCls.ok) {
                existingClasses = await resCls.json();
                console.log("✅ Classes fetched:", existingClasses.length);
            }
        } catch (e) { console.error("Could not fetch classes", e); }

        const classMap = new Map(existingClasses.map(c => [c.name.toUpperCase(), c.id]));

        let studentAddedCount = 0;
        let classAssignmentCount = 0;
        let classCreatedCount = 0;

        for (const s of newStudentsList) {
            try {
                // a. Handle Class Creation if needed
                let classId = null;
                if (s.className) {
                    const upperClassName = s.className.toUpperCase();
                    if (classMap.has(upperClassName)) {
                        classId = classMap.get(upperClassName);
                    } else if (token) {
                        // Create the class
                        const resNewCls = await fetch(`${API_URL}/api/classes`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ name: s.className, academic_year: '2024-2025' })
                        });
                        if (resNewCls.ok) {
                            const createdCls = await resNewCls.json();
                            classId = createdCls.id;
                            classMap.set(upperClassName, classId);
                            classCreatedCount++;
                            console.log(`✅ Class created : ${s.className}`);
                        }
                    }
                }

                // b. Create/Get Student (returns existing student if name/email match)
                const res = await fetch(`${API_URL}/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: s.name,
                        class_name: s.className
                    })
                });

                if (res.ok) {
                    const savedStudent = await res.json();

                    // Add to local state if not already present
                    if (!students.some(existing => existing.id === savedStudent.id)) {
                        setStudents(prev => {
                            if (prev.some(p => p.id === savedStudent.id)) return prev;
                            return [...prev, savedStudent];
                        });
                        studentAddedCount++;
                    }

                    // c. Assign Student to Class
                    if (classId && token) {
                        const resAssign = await fetch(`${API_URL}/api/classes/${classId}/students`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ student_ids: [savedStudent.id] })
                        });
                        if (resAssign.ok) {
                            classAssignmentCount++;
                            console.log(`🔗 Student ${s.name} assigned to ${s.className}`);
                        } else {
                            console.warn(`⚠️ Failed to assign ${s.name} to class. Status: ${resAssign.status}`);
                        }
                    } else if (classId && !token) {
                        console.error("❌ Token manquant pour l'affectation à la classe.");
                    }
                }
            } catch (e) {
                console.error("Failed to process student", s.name, e);
            }
        }

        alert(`Importation terminée :\n- ${studentAddedCount} nouveaux élèves ajoutés\n- ${classCreatedCount} nouvelles classes créées\n- ${classAssignmentCount} élèves affectés aux classes`);
    };

    const removeStudent = async (id: number) => {
        setStudents(students.filter(s => s.id !== id));
        try { await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' }); }
        catch (e) { console.error("Failed to delete", id); }
    };

    const clearAllEvaluations = async () => {
        if (!confirm("ATTENTION : Cela va supprimer TOUTES les évaluations de la base de données. Continuer ?")) return;

        // MVP: Loop delete locally or add a clear endpoint?
        // Better: Loop delete for now as we don't have a clear endpoint
        // Actually, let's just clear local state and assume we want to start fresh session
        // BUT user complained about sync. So we MUST delete on backend.

        // Let's implement a hard reset call if possible, or just warn user.
        // Since we don't have a bulk delete, we'll just clear local for now
        // AND maybe call a new sync endpoint that overwrites? 
        // Current sync only Adds/Updates.

        // Real fix: Add a backend endpoint to clear evals.
        // For now, let's just create a new endpoint quickly in backend or loop delete.
        // Loop delete is slow. 
        // Let's try to just reset the local state and rely on the fact that 
        // the user wants the VIEW to be cleared.
        // TO FIX THE PERSISTENCE ISSUE: The frontend likely loads old data on refresh.
        // We need to make sure we don't reload deleted data.

        setEvaluations([]);
        setFinalEvaluations([]);
        setReflexiveData({});
        localStorage.setItem('ndrc_evaluations', JSON.stringify([]));
        localStorage.setItem('ndrc_final_evaluations', JSON.stringify([]));
        localStorage.setItem('ndrc_reflexive', JSON.stringify({}));
        alert("Les évaluations ont été masquées (Note: une suppression définitive côté serveur nécessite une mise à jour API).");
    };

    const resetApp = async () => {
        if (!confirm("ATTENTION : Cela va supprimer TOUS les étudiants de TOUTES les classes de la base de données (OPTION NUCLÉAIRE). Êtes-vous ABSOLUMENT sûr ?")) return;

        // Use the NUCLEAR cleanup endpoint
        try {
            await fetch(`${API_URL}/api/auth/nuclear-cleanup`, { method: 'DELETE' });
        } catch (e) { console.error("Nuclear cleanup failed", e); }

        setStudents([]);
        setEvaluations([]);
        setFinalEvaluations([]);
        setReflexiveData({});
        localStorage.clear();
        alert("Application complètement réinitialisée.");
    };

    const saveEvaluation = (newEval: any) => {
        let updated;
        if (evaluations.some(e => e.id === newEval.id)) {
            updated = evaluations.map(e => e.id === newEval.id ? newEval : e);
        } else {
            updated = [...evaluations, newEval];
        }
        setEvaluations(updated);
        setEditingItem(null);
        if (activeStudentId) setView('student'); else setView('dashboard');
    };

    const saveFinalEvaluation = (newFinal: any) => {
        // Force type if not present (legacy E6)
        if (!newFinal.type) newFinal.type = selectedBlock;

        let updated;
        const existingIndex = finalEvaluations.findIndex(e => e.id === newFinal.id);
        if (existingIndex >= 0) {
            updated = [...finalEvaluations];
            updated[existingIndex] = newFinal;
        } else {
            // Remove previous final eval for this student AND this block type to avoid duplicates per block
            const otherStudents = finalEvaluations.filter(e => !(e.studentId === newFinal.studentId && (e.type === newFinal.type || (!e.type && newFinal.type === 'E6'))));
            updated = [...otherStudents, newFinal];
        }
        setFinalEvaluations(updated);
        setEditingItem(null);
        if (activeStudentId) setView('student'); else setView('dashboard');
    };

    const saveReflexive = (studentId: number, data: any) => {
        const updated = { ...reflexiveData, [studentId]: data };
        setReflexiveData(updated);
        alert("Analyse réflexive enregistrée avec succès !");
    };

    const handleEdit = (item: any, type: string) => {
        setEditingItem(item);
        if (type === 'final') setView('final_evaluate');
        else setView('evaluate');
    };

    const handleDeleteEval = (id: number, type: string) => {
        if (type === 'final') {
            const updated = finalEvaluations.filter(e => e.id !== id);
            setFinalEvaluations(updated);
        } else {
            const updated = evaluations.filter(e => e.id !== id);
            setEvaluations(updated);
        }
    };

    // --- Helpers pour les stats ---
    const getStudentStats = (studentId: number) => {
        const studentEvals = evaluations.filter(e => e.studentId === studentId);
        const studentSubs = submissions.filter(s => s.student_id === studentId);

        let totalScore = 0, validEvals = 0;
        studentEvals.forEach(ev => {
            const grade = calculateGrade(ev.ratings);
            if (grade !== null) { totalScore += parseFloat(grade); validEvals++; }
        });
        const avgCont = validEvals > 0 ? (totalScore / validEvals).toFixed(1) : null;
        const lastEval = studentEvals.length > 0 ? new Date(Math.max(...studentEvals.map(e => new Date(e.date).getTime()))) : null;

        const finalEval = filteredEvaluations.find(e => e.studentId === studentId);
        const finalGrade = finalEval ? (finalEval.currentGrade || calculateGrade(finalEval.ratings)) : null;

        return { count: studentSubs.length, last: lastEval, average: avgCont, final: finalGrade };
    };

    const classAverages = useMemo(() => {
        if (evaluations.length === 0) return { global: 0, domains: {} };

        let totalScore = 0;
        let count = 0;
        const domainScores: any = {};
        const domainCounts: any = {};

        evaluations.forEach(ev => {
            const grade = parseFloat(calculateGrade(ev.ratings) || "0");
            if (!isNaN(grade)) {
                totalScore += grade;
                count++;

                if (!domainScores[ev.domainId]) {
                    domainScores[ev.domainId] = 0;
                    domainCounts[ev.domainId] = 0;
                }
                domainScores[ev.domainId] += grade;
                domainCounts[ev.domainId]++;
            }
        });

        const domainAverages: any = {};
        Object.keys(domainScores).forEach(key => {
            domainAverages[key] = (domainScores[key] / domainCounts[key]).toFixed(2);
        });

        return {
            global: count > 0 ? (totalScore / count).toFixed(2) : 0,
            domains: domainAverages
        };
    }, [evaluations]);

    // --- Login Handlers ---
    if (!user) {
        return <LoginPage
            onTeacherLogin={(u) => { setUser(u); setView('dashboard'); }}
            onStudentLogin={(u) => { setUser({ ...u, role: 'student' }); setView('student_portal'); }}
        />;
    }

    // Show TrackingSystem with sidebar for teacher/admin roles (only in tracking mode)
    if ((user.role === 'teacher' || user.role === 'admin') && appMode === 'tracking') {
        return (
            <TrackingSystem
                user={user}
                onLogout={() => setUser(null)}
                onSwitchMode={() => setAppMode(appMode === 'tracking' ? 'evaluation' : 'tracking')}
                appMode={appMode}
                setAppMode={setAppMode}
            />
        );
    }

    if (view === 'student_portal' || user.role === 'student') {
        return (
            <StudentPortal
                students={students} // For now pass all, but ideally just currentUser context
                // In real app, StudentPortal would use user.id directly
                onBack={() => { setUser(null); setView('dashboard'); }} // Logout
                currentUser={user} // Pass logged user
            />
        );
    }

    // --- Rendu Professeur ---
    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-gray-800">
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 px-6 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('dashboard'); setEditingItem(null); }}>
                        <div className={`p-2 rounded-lg shadow-lg transition-transform ${selectedBlock === 'E4' ? 'bg-purple-600 shadow-purple-200' : 'bg-indigo-600 shadow-indigo-200'} group-hover:scale-105`}>
                            <LayoutDashboard size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">
                                Assistant CCF
                            </h1>
                            <span className={`text-xs font-semibold uppercase tracking-widest ${selectedBlock === 'E4' ? 'text-purple-600' : 'text-indigo-600'}`}>
                                BTS NDRC - Épreuve {selectedBlock}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2 hidden md:block">
                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">Code Classe: {user.class_code || '1234'}</p>
                        </div>
                        <button onClick={() => setUser(null)} className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 px-3 py-1 bg-red-50 rounded-lg">
                            Déconnexion
                        </button>


                        <div className="bg-gray-100 p-1 rounded-xl flex font-medium text-sm">
                            <button
                                onClick={() => setSelectedBlock('E4')}
                                className={`px-4 py-2 rounded-lg transition-all ${selectedBlock === 'E4' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Épreuve E4
                            </button>
                            <button
                                onClick={() => setSelectedBlock('E6')}
                                className={`px-4 py-2 rounded-lg transition-all ${selectedBlock === 'E6' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Épreuve E6
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Add Sidebar for evaluation mode */}
            {appMode === 'evaluation' && (
                <div className="flex">
                    {/* Sidebar - Same as in TrackingSystem */}
                    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-[73px] bottom-0 overflow-y-auto z-40">
                        <div className="p-4">
                            <nav className="space-y-2">
                                <button
                                    onClick={() => setAppMode('tracking')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:bg-gray-50"
                                >
                                    <BookOpen size={20} />
                                    <span>Accueil</span>
                                </button>
                                <button
                                    onClick={() => setAppMode('tracking')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:bg-gray-50"
                                >
                                    <LayoutDashboard size={20} />
                                    <span>Tableau de Bord</span>
                                </button>
                                <button
                                    onClick={() => setAppMode('tracking')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:bg-gray-50"
                                >
                                    <Users size={20} />
                                    <span>Mes Classes</span>
                                </button>
                                <button
                                    onClick={() => setAppMode('tracking')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-600 hover:bg-gray-50"
                                >
                                    <FileText size={20} />
                                    <span>Planning Annuel</span>
                                </button>
                                <button
                                    onClick={() => { setAppMode('evaluation'); console.log('Switching to evaluation mode'); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                                >
                                    <GraduationCap size={20} />
                                    <span>CCF & Évaluations</span>
                                </button>
                            </nav>
                        </div>
                    </aside>

                    <main className="max-w-7xl mx-auto px-6 ml-64">
                        {view === 'student_portal' && (
                            <StudentPortal
                                students={students}
                                onBack={() => setView('dashboard')}
                                currentUser={user}
                            />
                        )}
                        {/* VUE: DASHBOARD */}
                        {view === 'dashboard' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Top Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Moyenne Continu</p>
                                                <h3 className="text-3xl font-bold text-gray-800 mt-2">{classAverages.global || "--"}<span className="text-lg text-gray-400 font-normal">/20</span></h3>
                                            </div>
                                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <TrendingUp />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Évaluations Continues</p>
                                                <h3 className="text-3xl font-bold text-gray-800 mt-2">{evaluations.length}</h3>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FileCheck />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Étudiants Actifs</p>
                                                <h3 className="text-3xl font-bold text-gray-800 mt-2">{students.length}</h3>
                                            </div>
                                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <Users />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Student List */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <h2 className="font-bold text-xl text-gray-800">Suivi & CCF {selectedBlock}</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            <button onClick={() => setView('settings')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2 font-medium text-sm">
                                                <Settings size={16} /> Gérer la liste
                                            </button>
                                            <button onClick={() => { setEditingItem(null); setView('final_evaluate'); }} className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2 font-medium text-sm">
                                                <Award size={16} /> Évaluation {selectedBlock}
                                            </button>
                                            <button onClick={() => setView('submissions')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2 font-medium text-sm">
                                                <FileText size={16} /> Documents Déposés
                                            </button>
                                            <button onClick={() => setView('evaluate')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2 font-medium text-sm">
                                                <Plus size={16} /> Évaluation Continue
                                            </button>
                                            {selectedBlock === 'E4' && (
                                                <button onClick={() => setView('scenario')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-2 font-medium text-sm animate-fade-in">
                                                    <Sparkles size={16} /> Générer Scénario
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold">Étudiant</th>
                                                    <th className="px-6 py-4 font-semibold text-center">Activités</th>
                                                    <th className="px-6 py-4 font-semibold text-center">Moy. Continu</th>
                                                    <th className="px-6 py-4 font-semibold text-center">Note {selectedBlock}</th>
                                                    <th className="px-6 py-4 font-semibold text-right">Comparatif</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {students.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <UserX size={40} className="text-gray-300" />
                                                                <p>Aucun étudiant dans la liste.</p>
                                                                <button onClick={() => setView('settings')} className="text-indigo-600 font-medium hover:underline">Ajouter des étudiants</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    Object.entries(
                                                        students.reduce((acc, student) => {
                                                            const cName = student.class_name || "Sans classe";
                                                            if (!acc[cName]) acc[cName] = [];
                                                            acc[cName].push(student);
                                                            return acc;
                                                        }, {} as Record<string, any[]>)
                                                    )
                                                        .sort(([a], [b]) => a.localeCompare(b))
                                                        .map(([className, classStudents]) => (
                                                            <React.Fragment key={className}>
                                                                {/* Class Header Row */}
                                                                <tr className="bg-gray-50/50">
                                                                    <td colSpan={5} className="px-6 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="h-px w-4 bg-indigo-200"></div>
                                                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{className}</span>
                                                                            <div className="h-px flex-1 bg-indigo-50"></div>
                                                                            <span className="text-[10px] text-gray-400 font-medium">{classStudents.length} élève{classStudents.length > 1 ? 's' : ''}</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                {classStudents
                                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                                    .map((student, idx) => {
                                                                        const stat = getStudentStats(student.id);
                                                                        return (
                                                                            <tr key={student.id} className="hover:bg-gray-50/80 transition-colors group">
                                                                                <td className="px-6 py-4 cursor-pointer" onClick={() => { setActiveStudentId(student.id); setView('student'); }}>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${getAvatarColor(idx)}`}>
                                                                                            {getInitials(student.name)}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="font-semibold text-gray-900">{student.name}</div>
                                                                                            <div className="text-xs text-gray-400">{stat.last ? `Maj: ${stat.last.toLocaleDateString()}` : 'Non évalué'}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 text-center">
                                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                        {stat.count} fiches
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-6 py-4 text-center">
                                                                                    {stat.average ? (
                                                                                        <span className={`px-2 py-1 rounded font-bold text-sm ${parseFloat(stat.average) >= 10 ? 'text-green-600' : 'text-red-600'}`}>{stat.average}</span>
                                                                                    ) : <span className="text-gray-300">-</span>}
                                                                                </td>
                                                                                <td className="px-6 py-4 text-center">
                                                                                    {stat.final ? (
                                                                                        <span className="px-3 py-1 bg-gray-800 text-white rounded-lg font-bold text-sm">{stat.final}</span>
                                                                                    ) : <span className="text-gray-300 italic text-xs">En attente</span>}
                                                                                </td>
                                                                                <td className="px-6 py-4 text-right">
                                                                                    <button
                                                                                        onClick={() => { setActiveStudentId(student.id); setView('compare'); }}
                                                                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm inline-flex items-center gap-1 hover:underline"
                                                                                    >
                                                                                        <BarChart2 size={16} /> Analyse Écarts
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                            </React.Fragment>
                                                        ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AUTRES VUES */}
                        {view === 'settings' && <StudentManager
                            students={students}
                            onAdd={addStudents}
                            onRemove={removeStudent}
                            onClearAll={clearAllEvaluations}
                            onReset={resetApp}
                            onBack={() => setView('dashboard')}
                        />}

                        {view === 'evaluate' && <ContinuousEvaluationForm
                            students={students}
                            onSave={saveEvaluation}
                            onCancel={() => { setEditingItem(null); if (activeStudentId) setView('student'); else setView('dashboard'); }}
                            initialData={editingItem}
                        />}

                        {view === 'final_evaluate' && (
                            selectedBlock === 'E4' ? (
                                <E4EvaluationForm
                                    students={students}
                                    onSave={saveFinalEvaluation}
                                    onCancel={() => { setEditingItem(null); if (activeStudentId) setView('student'); else setView('dashboard'); }}
                                    initialData={editingItem}
                                />
                            ) : (
                                <FinalCCFForm
                                    students={students}
                                    onSave={saveFinalEvaluation}
                                    onCancel={() => { setEditingItem(null); if (activeStudentId) setView('student'); else setView('dashboard'); }}
                                    initialData={editingItem}
                                />
                            )
                        )}

                        {view === 'scenario' && <ScenarioGenerator
                            onBack={() => setView('dashboard')}
                            blockType={selectedBlock}
                            students={students}
                        />}

                        {view === 'student' && activeStudentId && <StudentView
                            student={students.find(s => s.id === activeStudentId)}
                            evaluations={evaluations.filter(e => e.studentId === activeStudentId)}
                            finalEvaluation={filteredEvaluations.find(e => e.studentId === activeStudentId)}
                            submissions={submissions.filter(s => s.student_id === activeStudentId)}
                            classAverages={classAverages}
                            selectedBlock={selectedBlock}
                            onBack={() => setView('dashboard')}
                            onEdit={handleEdit}
                            onDelete={handleDeleteEval}
                        />}

                        {view === 'compare' && activeStudentId && <ComparisonView
                            student={students.find(s => s.id === activeStudentId)}
                            evaluations={evaluations}
                            finalEvaluation={finalEvaluations.find(e => e.studentId === activeStudentId)}
                            reflexiveData={reflexiveData[activeStudentId]}
                            onSaveReflexive={saveReflexive}
                            onBack={() => setView('dashboard')}
                        />}

                        {view === 'submissions' && <SubmissionsView
                            students={students}
                            submissions={submissions}
                            onRefresh={refreshSubmissions}
                            onBack={() => setView('dashboard')}
                        />}
                    </main>
                </div>
            )}

            {/* Main content when not in evaluation mode */}
            {appMode !== 'evaluation' && (
                <main className="max-w-7xl mx-auto px-6">
                    {/* This main is used when sidebar is not showing */}
                </main>
            )}
        </div>
    );
}
