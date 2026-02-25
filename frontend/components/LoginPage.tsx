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
    const [sClassCode, setSClassCode] = useState('');
    const [sStep, setSStep] = useState(1);
    const [sStudentsList, setSStudentsList] = useState<any[]>([]);
    const [sSelectedStudent, setSSelectedStudent] = useState<any>(null);
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

    const handleClassCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/students/${sClassCode}`);
            if (!res.ok) throw new Error("Classe introuvable");

            const data = await res.json();
            if (data.length === 0) {
                alert("Aucun élève trouvé dans cette classe.");
                return;
            }
            setSStudentsList(data);
            setSStep(2);
        } catch (err) { alert("Erreur : Code classe invalide ou problème connexion"); }
    };

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/auth/student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class_code: sClassCode,
                    student_id: sSelectedStudent.id,
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
                alert("Code personnel incorrect !");
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
                        <div className="animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                    <Users size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Connexion Eleve</h2>
                                <p className="text-gray-500 text-sm">
                                    {sStep === 1 && "Entrez le code de votre classe"}
                                    {sStep === 2 && "Selectionnez votre nom"}
                                    {sStep === 3 && "Entrez votre code personnel"}
                                </p>
                            </div>

                            {sStep === 1 && (
                                <form onSubmit={handleClassCodeSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Code Classe</label>
                                        <div className="relative">
                                            <School className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={sClassCode}
                                                onChange={e => setSClassCode(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest text-lg font-mono uppercase"
                                                placeholder="CODE"
                                                maxLength={6}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 text-center">Demandez ce code a votre professeur</p>
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                                        Valider le code
                                    </button>
                                </form>
                            )}

                            {sStep === 2 && (
                                <div className="space-y-4">
                                    <button onClick={() => setSStep(1)} className="text-sm text-gray-500 hover:text-indigo-600 mb-2">← Changer de code classe</button>
                                    <h3 className="font-bold text-gray-700">Qui etes-vous ?</h3>
                                    <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
                                        {sStudentsList.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => { setSSelectedStudent(s); setSStep(3); }}
                                                className="text-left p-3 rounded-lg border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all font-medium"
                                            >
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sStep === 3 && (
                                <form onSubmit={handleStudentLogin} className="space-y-6">
                                    <button type="button" onClick={() => setSStep(2)} className="text-sm text-gray-500 hover:text-indigo-600 mb-2">← Changer d'eleve</button>

                                    <div className="bg-indigo-50 p-4 rounded-xl text-center mb-4">
                                        <p className="text-indigo-800 font-bold">{sSelectedStudent?.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Votre Code Personnel</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <input
                                                type="password"
                                                value={sPassword}
                                                onChange={e => setSPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest text-lg font-mono"
                                                placeholder="0000"
                                                maxLength={4}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                                        Entrer dans l'espace eleve
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
