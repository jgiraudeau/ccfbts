import React, { useState } from 'react';
import { User, Lock, Users, School, Shield, Sparkles } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Colonne Marketing (Gauche) */}
            <div className="hidden mt-4 ml-4 mb-4 lg:flex lg:w-5/12 bg-gradient-to-br from-indigo-800 via-indigo-700 to-purple-800 rounded-3xl text-white p-12 flex-col justify-between relative shadow-2xl overflow-hidden shadow-indigo-500/20">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400 opacity-20 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

                <div className="relative z-10 animate-fade-in">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                            <Shield size={28} className="text-indigo-200" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">ProfVirtuel <span className="text-indigo-300">V2</span></h1>
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-extrabold mb-6 leading-tight">L'assistant pédagogique nouvelle génération <br />pour le BTS NDRC.</h2>
                    <p className="text-lg xl:text-xl text-indigo-100/90 mb-10 max-w-lg leading-relaxed font-medium">
                        Simplifiez vos évaluations CCF, suivez la progression de vos étudiants en temps réel, et profitez de la puissance de l'IA pour vos scénarios.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10 mt-1 flex-shrink-0">
                                <School size={22} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white mb-1">Évaluations E4 & E6 simplifiées</h3>
                                <p className="text-indigo-200 text-sm leading-relaxed">Grilles officielles CCF intégrées, calcul automatisé des notes et édition facilitée en cours de formation.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10 mt-1 flex-shrink-0">
                                <Users size={22} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white mb-1">Suivi hyper-individualisé</h3>
                                <p className="text-indigo-200 text-sm leading-relaxed">Tableaux de bord détaillés par étudiant, analyses d'écarts de compétences et portail élève transparent.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10 mt-1 flex-shrink-0">
                                <Sparkles size={22} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white mb-1">Scénarios générés par IA</h3>
                                <p className="text-indigo-200 text-sm leading-relaxed">Création instantanée de contextes de négociation (Cible, Objectifs, Objections) grâce au modèle Gemini.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-8">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <p className="text-sm font-medium text-indigo-50 leading-relaxed italic mb-4">"Une plateforme tout-en-un qui modernise enfin l'accès et le suivi de nos grilles de CCF, avec une fluidité remarquable."</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-400 border border-white/50"></div>
                            <div>
                                <p className="text-xs font-bold text-white">Formateur NDRC</p>
                                <p className="text-[10px] text-indigo-200 uppercase tracking-wider">Témoignage</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne Connexion (Droite) */}
            <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-12 relative">
                {/* Mobile header (hidden on desktop) */}
                <div className="lg:hidden w-full max-w-md text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900">ProfVirtuel <span className="text-indigo-600">V2</span></h1>
                    <p className="text-gray-500 mt-2">Assistant pédagogique BTS NDRC</p>
                </div>

                <div className="w-full max-w-[440px]">
                    <div className="mb-8 text-center text-gray-500 font-medium">
                        Connectez-vous à votre espace
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative z-10 w-full">
                        {/* Onglets */}
                        <div className="flex bg-gray-50/80 p-2 gap-2 border-b border-gray-100">
                            <button
                                onClick={() => setMode('student')}
                                className={`flex-1 py-3 px-2 rounded-xl font-bold text-center transition-all text-xs sm:text-sm ${mode === 'student' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                            >
                                <Users size={16} className="inline mr-1.5 mb-0.5 opacity-70" />
                                <span className="hidden sm:inline">Espace</span> Élève
                            </button>
                            <button
                                onClick={() => setMode('teacher')}
                                className={`flex-1 py-3 px-2 rounded-xl font-bold text-center transition-all text-xs sm:text-sm ${mode === 'teacher' ? 'bg-white text-purple-700 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                            >
                                <School size={16} className="inline mr-1.5 mb-0.5 opacity-70" />
                                <span className="hidden sm:inline">Espace</span> Prof
                            </button>
                            <button
                                onClick={() => setMode('admin')}
                                className={`flex-1 py-3 px-2 rounded-xl font-bold text-center transition-all text-xs sm:text-sm ${mode === 'admin' ? 'bg-white text-red-700 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                            >
                                <Shield size={16} className="inline mr-1.5 mb-0.5 opacity-70" />
                                Admin
                            </button>
                        </div>

                        {/* Formulaires */}
                        <div className="p-8 sm:p-10">
                            {mode === 'admin' && (
                                <form onSubmit={handleAdminSubmit} className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900">Administration</h2>
                                        <p className="text-gray-500 text-sm mt-1">Gestion de la plateforme via identifiants sécurisés</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email administrateur</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="email"
                                                    value={aEmail}
                                                    onChange={e => setAEmail(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                                    placeholder="admin@etablissement.fr"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Mot de passe</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={aPassword}
                                                    onChange={e => setAPassword(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-200/50 hover:-translate-y-0.5 mt-4">
                                        Ouvrir le panneau d'administration
                                    </button>
                                </form>
                            )}

                            {mode === 'teacher' && (
                                <form onSubmit={handleTeacherSubmit} className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900">Bienvenue, Formateur</h2>
                                        <p className="text-gray-500 text-sm mt-1">Accédez à votre tableau de bord et à vos classes</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email académique ou privé</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={tEmail}
                                                    onChange={e => setTEmail(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                                    placeholder="professeur@ecole.fr"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Mot de passe</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={tPin}
                                                    onChange={e => setTPin(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-200/50 hover:-translate-y-0.5 mt-4">
                                        Accéder à mon espace
                                    </button>
                                </form>
                            )}

                            {mode === 'student' && (
                                <form onSubmit={handleStudentLogin} className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900">Bienvenue à toi !</h2>
                                        <p className="text-gray-500 text-sm mt-1">Consulte tes notes CCF et dépose tes documents</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Identifiant</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={sUsername}
                                                    onChange={e => setSUsername(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                                    placeholder="prenom-nom"
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-2 ml-1 flex items-center gap-1">
                                                <span>*</span> Identifiant communiqué par ton formateur
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Code secret</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={sPassword}
                                                    onChange={e => setSPassword(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-0.5 mt-4">
                                        Me connecter
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="text-center mt-8 text-sm text-gray-400 font-medium">
                        © {new Date().getFullYear()} ProfVirtuel V2 • Assistant CCF NDRC
                    </div>
                </div>
            </div>
        </div>
    );
}
