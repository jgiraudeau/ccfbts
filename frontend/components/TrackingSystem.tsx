import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Calendar, FileText, Settings,
    Shield, LogOut, BookOpen, GraduationCap
} from 'lucide-react';

// Import tracking system components
import ClassManager from './ClassManager';
import PlanningManager from './PlanningManager';
import StudentDeadlines from './StudentDeadlines';
import TeacherDashboard from './TeacherDashboard';
import AdminPanel from './AdminPanel';

interface TrackingSystemProps {
    user: any;
    onLogout: () => void;
}

export default function TrackingSystem({ user, onLogout }: TrackingSystemProps) {
    const [activeView, setActiveView] = useState('dashboard');

    // Déterminer les vues disponibles selon le rôle
    const getAvailableViews = () => {
        if (user.role === 'admin') {
            return [
                { id: 'admin', label: 'Administration', icon: Shield },
                { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
            ];
        } else if (user.role === 'teacher') {
            return [
                { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
                { id: 'classes', label: 'Mes Classes', icon: Users },
                { id: 'planning', label: 'Planning Annuel', icon: Calendar },
            ];
        } else if (user.role === 'student') {
            return [
                { id: 'deadlines', label: 'Mes Échéances', icon: FileText },
            ];
        }
        return [];
    };

    const views = getAvailableViews();

    // Set default view based on role
    useEffect(() => {
        if (user.role === 'admin') {
            setActiveView('admin');
        } else if (user.role === 'teacher') {
            setActiveView('dashboard');
        } else if (user.role === 'student') {
            setActiveView('deadlines');
        }
    }, [user.role]);

    const renderContent = () => {
        // Admin views
        if (user.role === 'admin') {
            if (activeView === 'admin') return <AdminPanel />;
            if (activeView === 'dashboard') return <TeacherDashboard />;
        }

        // Teacher views
        if (user.role === 'teacher') {
            if (activeView === 'dashboard') return <TeacherDashboard />;
            if (activeView === 'classes') return <ClassManager />;
            if (activeView === 'planning') return <PlanningManager />;
        }

        // Student views
        if (user.role === 'student') {
            if (activeView === 'deadlines') return <StudentDeadlines />;
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
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-lg">
                                    <BookOpen size={24} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">ProfVirtuel</h1>
                                    <p className="text-xs text-gray-500">Système de Suivi BTS NDRC</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                <div className="flex items-center gap-2 justify-end mt-1">
                                    {getRoleBadge()}
                                </div>
                            </div>
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="hidden md:inline">Déconnexion</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Side Navigation + Content */}
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
                    <div className="p-4">
                        <nav className="space-y-2">
                            {views.map((view) => {
                                const Icon = view.icon;
                                const isActive = activeView === view.id;
                                return (
                                    <button
                                        key={view.id}
                                        onClick={() => setActiveView(view.id)}
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

                {/* Main Content */}
                <main className="flex-1">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
