import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from "lucide-react";
import { calculateGrade, RATINGS, Domain, ExamType, Skill } from '../app/types';
import { DOMAINS } from '../app/constants';

interface ContinuousEvaluationFormProps {
    students: any[];
    onSave: (data: any) => void;
    onCancel: () => void;
    initialData: any;
}

export default function ContinuousEvaluationForm({ students, onSave, onCancel, initialData }: ContinuousEvaluationFormProps) {
    // État pour savoir si on évalue E4 ou E6. Par défaut E6.
    const [selectedExam, setSelectedExam] = useState<ExamType>('E6');

    // On récupère le premier domaine compatible comme valeur par défaut
    const getDefaultDomain = (exam: ExamType) => {
        return Object.keys(DOMAINS).find(key => DOMAINS[key].exam === exam) || '';
    };

    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedDomain, setSelectedDomain] = useState(getDefaultDomain('E6'));
    const [ratings, setRatings] = useState<Record<string, string>>({});
    const [comment, setComment] = useState('');

    // Si on change d'examen, on reset le domaine
    useEffect(() => {
        if (!initialData) {
            setSelectedDomain(getDefaultDomain(selectedExam));
            setRatings({}); // Reset notes
        }
    }, [selectedExam, initialData]);

    const currentDomainData: Domain = DOMAINS[selectedDomain];
    const currentGrade = useMemo(() => calculateGrade(ratings), [ratings]);

    // Initialisation data (Edit Mode)
    useEffect(() => {
        if (initialData) {
            setSelectedStudent(initialData.studentId.toString());
            // Trouver l'examType en fonction du domainId
            const domain = DOMAINS[initialData.domainId];
            if (domain) {
                setSelectedExam(domain.exam || 'E6');
                setSelectedDomain(initialData.domainId);
            }
            setRatings(initialData.ratings || {});
            setComment(initialData.comment || '');
        }
    }, [initialData]);

    // Filtrer les domaines selon l'examen choisi
    const filteredDomains = Object.entries(DOMAINS).filter(([key, val]) => val.exam === selectedExam);

    return (
        <div className="max-w-4xl mx-auto animate-slide-up">
            <button onClick={onCancel} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft size={20} /> Retour
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className={`bg-gradient-to-r ${currentDomainData?.gradient || 'from-gray-500 to-gray-400'} p-8 text-white relative transition-colors duration-500`}>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        {initialData ? "Modifier l'évaluation" : "Nouvelle Évaluation Continue"}
                        <span className="bg-white/20 px-2 py-1 rounded text-sm font-black tracking-wide">{selectedExam}</span>
                    </h2>
                    <p className="opacity-90">{currentDomainData?.title || 'Sélectionnez un domaine...'}</p>
                    <div className="absolute top-8 right-8 bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                        <div className="text-3xl font-bold">{currentGrade || '--'}</div>
                        <div className="text-xs opacity-75">/ 20</div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Selecteurs Principaux */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* 1. Choix Exam (si pas en modification) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Épreuve</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setSelectedExam('E6')}
                                    disabled={!!initialData}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${selectedExam === 'E6' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    E6 (Bloc 3)
                                </button>
                                <button
                                    onClick={() => setSelectedExam('E4')}
                                    disabled={!!initialData}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${selectedExam === 'E4' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    E4 (Bloc 2)
                                </button>
                            </div>
                        </div>

                        {/* 2. Choix Étudiant */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Étudiant</label>
                            <select
                                className="w-full p-3 border rounded-xl bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 font-medium"
                                value={selectedStudent}
                                onChange={e => setSelectedStudent(e.target.value)}
                                disabled={!!initialData}
                            >
                                <option value="">Choisir un étudiant...</option>
                                {students.sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* 3. Choix Domaine */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Domaine / Compétence</label>
                            <select
                                className="w-full p-3 border rounded-xl bg-gray-50 font-medium"
                                value={selectedDomain}
                                onChange={e => { setSelectedDomain(e.target.value); setRatings({}); }}
                            >
                                {filteredDomains.map(([k, v]) => <option key={k} value={k}>{v.subtitle}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Grille d'évaluation */}
                    <div className="space-y-6 animate-fade-in">
                        {currentDomainData?.skills.map((skill: Skill) => (
                            <div key={skill.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                                    <div className="flex-1">
                                        <span className="font-bold text-gray-800 block text-md">{skill.name}</span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {skill.criteria.map((crt, idx) => (
                                                <span key={idx} className="bg-white border border-gray-200 text-xs px-2 py-1 rounded text-gray-500">{crt}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {RATINGS.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => setRatings(prev => ({ ...prev, [skill.id.toString()]: r.id }))}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${ratings[skill.id.toString()] === r.id ? r.activeColor + ' scale-110 shadow-md ring-2 ring-offset-1 ring-gray-200' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Commentaire / Feedback</label>
                        <textarea
                            className="w-full p-4 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                            rows={3}
                            placeholder="Observations, points forts, axes d'amélioration..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button onClick={onCancel} className="px-5 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Annuler</button>
                        <button onClick={() => {
                            if (!selectedStudent) return alert('Sélectionnez un étudiant');
                            if (!selectedDomain) return alert('Sélectionnez un domaine');
                            onSave({
                                id: initialData ? initialData.id : Date.now(),
                                studentId: parseInt(selectedStudent),
                                domainId: selectedDomain,
                                date: initialData ? initialData.date : new Date().toISOString(),
                                ratings,
                                comment
                            });
                        }} className={`px-6 py-2 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold ${selectedExam === 'E6' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                            {initialData ? "Mettre à jour" : "Enregistrer"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
