import React, { useState } from 'react';
import { User, Lock, Users, School, Shield } from 'lucide-react';

interface LoginPageProps {
    onTeacherLogin: (user: any) => void;
    onStudentLogin: (user: any) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage({ onTeacherLogin, onStudentLogin }: LoginPageProps) {
    const [mode, setMode] = useState<'student' | 'teacher' | 'admin'>('student');

    // Admin Form
    const [aEmail, setAEmail] = useState('');
    const [aPassword, setAPassword] = useState('');

    // Teacher Form
    const [tEmail, setTEmail] = useState('');
    const [tPin, setTPin] = useState('');

    // Student Form
    const [sUsername, setSUsername] = useState('');
    const [sPassword, setSPassword] = useState('');

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: aEmail, password: aPassword })
            });

            if (res.ok) {
                const userData = await res.json();
                if (userData.access_token) {
                    localStorage.setItem('token', userData.access_token);
                }
                onTeacherLogin(userData);
            } else {
                const errData = await res.json();
                alert(errData.detail || "Identifiants incorrects");
            }
        } catch (err) { alert("Erreur connexion"); }
    };

    const handleTeacherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: tEmail, pin: tPin })
            });

            if (res.ok) {
                const userData = await res.json();
                if (userData.access_token) {
                    localStorage.setItem('token', userData.access_token);
                }
                onTeacherLogin(userData);
            } else {
                const errData = await res.json();
                alert(errData.detail || "Identifiants incorrects");
            }
        } catch (err) { alert("Erreur connexion"); }
    };

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: sUsername.toLowerCase().trim(),
                    password: sPassword
                })
            });

            if (res.ok) {
                const userData = await res.json();
                if (userData.access_token) {
                    localStorage.setItem('token', userData.access_token);
                }
                onStudentLogin(userData);
            } else {
                const errData = await res.json();
                alert(errData.detail || "Identifiants incorrects");
            }
        } catch (err) { alert("Erreur d'authentification"); }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex border-b">
                    <button
                        onClick={() => setMode('student')}
                        className={`flex-1 py-3 font-bold text-center transition-colors text-sm ${mode === 'student' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Espace Eleve
                    </button>
                    <button
                        onClick={() => setMode('teacher')}
                        className={`flex-1 py-3 font-bold text-center transition-colors text-sm ${mode === 'teacher' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Espace Professeur
                    </button>
                    <button
                        onClick={() => setMode('admin')}
                        className={`flex-1 py-3 font-bold text-center transition-colors text-sm ${mode === 'admin' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Administration
                    </button>
                </div>

                <div className="p-8">
                    {mode === 'admin' && (
                        <form onSubmit={handleAdminSubmit} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                                    <Shield size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Administration</h2>
                                <p className="text-gray-500 text-sm">Gestion de la plateforme</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email administrateur</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={aEmail}
                                        onChange={e => setAEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="admin@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={aPassword}
                                        onChange={e => setAPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="Mot de passe"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-200">
                                Se connecter
                            </button>
                        </form>
                    )}

                    {mode === 'teacher' && (
                        <form onSubmit={handleTeacherSubmit} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                                    <School size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Connexion Professeur</h2>
                                <p className="text-gray-500 text-sm">Accedez a votre tableau de bord</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={tEmail}
                                        onChange={e => setTEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="votre.email@ecole.fr"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={tPin}
                                        onChange={e => setTPin(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Mot de passe"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-purple-200">
                                Se connecter
                            </button>
                        </form>
                    )}

                    {mode === 'student' && (
                        <form onSubmit={handleStudentLogin} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                    <Users size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Connexion Eleve</h2>
                                <p className="text-gray-500 text-sm">Entrez votre identifiant et mot de passe</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Identifiant</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={sUsername}
                                        onChange={e => setSUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="prenom-nom"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Votre identifiant a ete communique par votre professeur</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={sPassword}
                                        onChange={e => setSPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0000"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200">
                                Se connecter
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
