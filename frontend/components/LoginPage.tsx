import React, { useState } from 'react';
import { User, Lock, Users, School } from 'lucide-react';

interface LoginPageProps {
    onTeacherLogin: (user: any) => void;
    onStudentLogin: (user: any) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage({ onTeacherLogin, onStudentLogin }: LoginPageProps) {
    const [mode, setMode] = useState<'teacher' | 'student'>('student'); // Default to student

    // Teacher Form
    const [tEmail, setTEmail] = useState('prof@ccfbts.fr');
    const [tPin, setTPin] = useState('1234');

    // Student Form
    const [sClassCode, setSClassCode] = useState('');
    const [sStep, setSStep] = useState(1); // 1: Code, 2: Select Name, 3: Password
    const [sStudentsList, setSStudentsList] = useState<any[]>([]);
    const [sSelectedStudent, setSSelectedStudent] = useState<any>(null);
    const [sPassword, setSPassword] = useState('');

    const handleTeacherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Real API Login
            const res = await fetch(`${API_URL}/api/auth/teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: tEmail, pin: tPin })
            });

            if (res.ok) {
                const userData = await res.json();
                // Stocker le token JWT
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
        // Fetch students for this class code
        if (sClassCode !== '1234') {
            alert("Code classe inconnu (Essayer 1234)");
            return;
        }

        try {
            // Fetch students linked to this teacher (class code)
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
                // Stocker le token JWT
                if (userData.access_token) {
                    localStorage.setItem('token', userData.access_token);
                }
                onStudentLogin(userData); // {id, name, role}
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
                        className={`flex-1 py-4 font-bold text-center transition-colors ${mode === 'student' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Espace Élève
                    </button>
                    <button
                        onClick={() => setMode('teacher')}
                        className={`flex-1 py-4 font-bold text-center transition-colors ${mode === 'teacher' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Espace Professeur
                    </button>
                </div>

                <div className="p-8">
                    {mode === 'teacher' ? (
                        <form onSubmit={handleTeacherSubmit} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                                    <School size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Connexion Professeur</h2>
                                <p className="text-gray-500 text-sm">Accédez à votre tableau de bord</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email ou Identifiant</label>
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
                                <label className="block text-sm font-bold text-gray-700 mb-1">Code PIN / Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={tPin}
                                        onChange={e => setTPin(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Enter PIN"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-purple-200">
                                Se connecter
                            </button>
                        </form>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                    <Users size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Connexion Élève</h2>
                                <p className="text-gray-500 text-sm">
                                    {sStep === 1 && "Entrez le code de votre classe"}
                                    {sStep === 2 && "Sélectionnez votre nom"}
                                    {sStep === 3 && "Entrez votre code personnel (0000)"}
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
                                        <p className="text-xs text-gray-400 mt-2 text-center">Demandez ce code à votre professeur (ex: 1234)</p>
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                                        Valider le code
                                    </button>
                                </form>
                            )}

                            {sStep === 2 && (
                                <div className="space-y-4">
                                    <button onClick={() => setSStep(1)} className="text-sm text-gray-500 hover:text-indigo-600 mb-2">← Changer de code classe</button>
                                    <h3 className="font-bold text-gray-700">Qui êtes-vous ?</h3>
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
                                    <button type="button" onClick={() => setSStep(2)} className="text-sm text-gray-500 hover:text-indigo-600 mb-2">← Changer d'élève</button>

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
                                        Entrer dans l'espace élève
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
