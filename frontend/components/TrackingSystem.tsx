import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Calendar, FileText, Settings,
    Shield, LogOut, BookOpen, GraduationCap, ClipboardCheck, Sparkles
} from 'lucide-react';
import Link from 'next/link';

// Import tracking system components
import ClassManager from './ClassManager';
import PlanningManager from './PlanningManager';
import StudentDeadlines from './StudentDeadlines';
import TeacherDashboard from './TeacherDashboard';
import SubmissionsManager from './SubmissionsManager';
import ScenarioGenerator from './ScenarioGenerator';
import AdminPanel from './AdminPanel';
import WelcomeDashboard from './WelcomeDashboard';
import StudentPortal from './StudentPortal';

interface TrackingSystemProps {
    user: any;
    onLogout: () => void;
    onSwitchMode: () => void;
    appMode?: 'evaluation' | 'tracking';
    setAppMode?: (mode: 'evaluation' | 'tracking') => void;
}

export default function TrackingSystem({ user, onLogout, onSwitchMode, appMode = 'tracking', setAppMode }: TrackingSystemProps) {
    const [activeView, setActiveView] = useState('dashboard');
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        const fetchStudents = async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
        if (user.role === 'teacher') {
            fetchStudents();
        }
    }, [user.role]);

    // If we're in evaluation mode, don't render TrackingSystem - let page.tsx handle it
    if (appMode === 'evaluation') {
        return null;
    }

    // Déterminer les vues disponibles selon le rôle
    const getAvailableViews = () => {
        if (user.role === 'admin') {
            return [
                { id: 'admin', label: 'Administration', icon: Shield },
                { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
            ];
        } else if (user.role === 'teacher') {
            return [
                { id: 'welcome', label: 'Accueil', icon: BookOpen },
                { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
                { id: 'classes', label: 'Mes Classes', icon: Users },
                { id: 'planning', label: 'Planning Annuel', icon: Calendar },
                { id: 'documents', label: 'Documents Déposés', icon: FileText },
                { id: 'scenario', label: 'Scénarios E4', icon: Sparkles },
                { id: 'evaluation', label: 'CCF & Évaluations', icon: ClipboardCheck, action: 'switchMode' },
            ];
        } else if (user.role === 'student') {
            return [
                { id: 'deadlines', label: 'Mes Échéances', icon: Calendar },
                { id: 'remise_e4', label: 'Remise Fiche E4', icon: FileText },
                { id: 'remise_e6', label: 'Remise Fiche E6', icon: FileText },
            ];
        }
        return [];
    };

    const views = getAvailableViews();

    // Set default view based on role
    useEffect(() => {
        if (!activeView) { // Only set if not already set, or on role change
            if (user.role === 'admin') {
                setActiveView('admin');
            } else if (user.role === 'teacher') {
                setActiveView('welcome');
            } else if (user.role === 'student') {
                setActiveView('deadlines');
            }
        }
    }, [user.role, activeView]); // Added activeView to dependency array to prevent re-setting if already set

    const renderContent = () => {
        // Admin views
        if (user.role === 'admin') {
            if (activeView === 'admin') return <AdminPanel />;
            if (activeView === 'dashboard') return <TeacherDashboard />;
        }

        // Teacher views
        if (user.role === 'teacher') {
            if (activeView === 'welcome') return <WelcomeDashboard onNavigate={(id) => {
                if (id === 'evaluation') {
                    onSwitchMode();
                } else {
                    setActiveView(id);
                }
            }} />;
            if (activeView === 'dashboard') return <TeacherDashboard />;
            if (activeView === 'classes') return <ClassManager />;
            if (activeView === 'planning') return <PlanningManager />;
            if (activeView === 'documents') return <SubmissionsManager />;
            if (activeView === 'scenario') return <ScenarioGenerator onBack={() => setActiveView('welcome')} blockType="E4" students={students} />;
        }

        // Student views
        if (user.role === 'student') {
            if (activeView === 'deadlines') return <StudentDeadlines />;
            if (activeView === 'remise_e4') return <StudentPortal students={[user]} currentUser={user} onBack={() => { }} defaultType="E4_SITUATION" />;
            if (activeView === 'remise_e6') return <StudentPortal students={[user]} currentUser={user} onBack={() => { }} defaultType="E6_CR" />;
        }

        return <div className="text-center py-12">Vue non disponible</div>;
    };

    const getRoleBadge = () => {
        const badges = {
            admin: { bg: 'bg-red-100', text: 'text-red-700', label: '🛡️ Administrateur' },
            teacher: { bg: 'bg-blue-100', text: 'text-blue-700', label: '👨‍🏫 Professeur' },
            student: { bg: 'bg-green-100', text: 'text-green-700', label: '👨‍🎓 Élève' }
        };
        const badge = badges[user.role as keyof typeof badges] || badges.student;
        return (
            <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full font-medium`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex justify-between items-center">
                        {/* Logo & titre */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                                <BookOpen size={22} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 leading-none">Assistant CCF</h1>
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600">Suivi BTS NDRC</p>
                            </div>
                        </div>

                        {/* Utilisateur & déconnexion */}
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                    {user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                                    <div className="flex items-center gap-2 justify-end mt-0.5">
                                        {getRoleBadge()}
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:block w-px h-8 bg-gray-200"></div>
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
                            >
                                <LogOut size={16} />
                                <span className="hidden md:inline">Déconnexion</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Side Navigation + Content */}
            <div className="flex">
                {/* Sidebar - Fixed position, always visible */}
                <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-[73px] bottom-0 overflow-y-auto z-40">
                    <div className="p-4">
                        <nav className="space-y-2">
                            {views.map((view) => {
                                const Icon = view.icon;
                                const isActive = activeView === view.id;
                                return (
                                    <button
                                        key={view.id}
                                        onClick={() => {
                                            if (view.action === 'switchMode') {
                                                onSwitchMode();
                                            } else {
                                                setActiveView(view.id);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span>{view.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Main Content - Add margin to account for fixed sidebar */}
                <main className="flex-1 ml-64 min-h-screen flex flex-col">
                    <div className="flex-1">
                        {renderContent()}
                    </div>
                    <footer className="py-8 border-t border-gray-200 text-center text-sm text-gray-400 font-medium print:hidden bg-white/50 backdrop-blur-sm">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-center items-center gap-6">
                            <span className="opacity-70">© {new Date().getFullYear()} Assistant CCF BTS NDRC</span>
                            <div className="flex items-center gap-6">
                                <Link href="/privacy" className="hover:text-indigo-600 hover:underline transition-colors uppercase tracking-widest text-[10px] font-bold">
                                    Politique de Confidentialité
                                </Link>
                                <Link href="/legal" className="hover:text-indigo-600 hover:underline transition-colors uppercase tracking-widest text-[10px] font-bold">
                                    Mentions Légales
                                </Link>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
