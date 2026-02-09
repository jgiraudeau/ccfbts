import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Award, Save } from "lucide-react";
import { calculateGrade, RATINGS } from '../app/types';

// TODO: Centraliser cette structure
const CCF_GRILLE = {
    title: "GRILLE D'AIDE À L'ÉVALUATION - CCF FINAL",
    sections: [
        {
            id: 'E6_DISTRIBUTION',
            title: "Implanter et promouvoir l'offre (Distributeurs)",
            skills: [
                { id: 'ccf_distrib_1', name: "Valoriser l’offre sur le lieu de vente", desc: "Rigueur suivi accords, cohérence merchandising, argumentation" },
                { id: 'ccf_distrib_2', name: "Développer la présence dans le réseau", desc: "Diagnostic rayon/zone, identification opportunités, choix techniques" }
            ]
        },
        {
            id: 'E6_PARTENARIAT',
            title: "Développer et piloter un réseau de partenaires",
            skills: [
                { id: 'ccf_part_1', name: "Participer au développement du réseau", desc: "Analyse environnement, SWOT, sélection partenaires" },
                { id: 'ccf_part_2', name: "Mobiliser un réseau et évaluer performances", desc: "Actions animation, outils évaluation, efficience" }
            ]
        },
        {
            id: 'E6_VD',
            title: "Créer et animer un réseau de vente directe",
            skills: [
                { id: 'ccf_vd_1', name: "Prospecter, organiser et vendre en réunion", desc: "Fichier prospects, OAV, conduite de réunion" },
                { id: 'ccf_vd_2', name: "Recruter, former et dynamiser", desc: "Process recrutement, cadre légal/éthique, stimulation réseau" }
            ]
        }
    ]
};

interface FinalCCFFormProps {
    students: any[];
    onSave: (data: any) => void;
    onCancel: () => void;
    initialData: any;
}

export default function FinalCCFForm({ students, onSave, onCancel, initialData }: FinalCCFFormProps) {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [ratings, setRatings] = useState<Record<string, string>>({});
    const [globalComment, setGlobalComment] = useState('');

    // Memo
    const currentGrade = useMemo(() => calculateGrade(ratings), [ratings]);

    useEffect(() => {
        if (initialData) {
            setSelectedStudent(initialData.studentId.toString());
            setRatings(initialData.ratings || {});
            setGlobalComment(initialData.globalComment || '');
        }
    }, [initialData]);

    return (
        <div className="max-w-4xl mx-auto animate-slide-up">
            <button onClick={onCancel} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
                <ArrowLeft size={20} /> Retour
            </button>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 text-white p-8 relative">
                    <h2 className="text-2xl font-bold flex items-center gap-3"><Award /> {initialData ? "Modifier CCF Final" : "Évaluation CCF Final 2026"}</h2>
                    <p className="text-gray-400 mt-1">Grille officielle consolidée (Distribution, Partenariat, VD)</p>
                    <div className="absolute top-8 right-8 bg-white/10 backdrop-blur rounded-lg p-3 text-center border border-white/20">
                        <div className="text-4xl font-bold text-yellow-400">{currentGrade || '--'}</div>
                        <div className="text-xs text-gray-300">NOTE FINALE / 20</div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Candidat</label>
                        <select
                            className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 font-medium text-lg focus:ring-2 focus:ring-gray-900 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            value={selectedStudent}
                            onChange={e => setSelectedStudent(e.target.value)}
                            disabled={!!initialData}
                        >
                            <option value="">Sélectionner le candidat...</option>
                            {students.sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-10">
                        {CCF_GRILLE.sections.map(section => (
                            <div key={section.id} className="border-t border-gray-100 pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-gray-900 rounded-full"></span> {section.title}
                                </h3>
                                <div className="grid gap-4">
                                    {section.skills.map(skill => (
                                        <div key={skill.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{skill.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{skill.desc}</div>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    {RATINGS.map(r => (
                                                        <button
                                                            key={r.id}
                                                            onClick={() => setRatings(prev => ({ ...prev, [skill.id]: r.id }))}
                                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${ratings[skill.id] === r.id ? r.activeColor + ' ring-2 ring-offset-2 ring-gray-900' : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                                                        >
                                                            {r.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Appréciation Générale du Jury</label>
                        <textarea className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-gray-900 outline-none" rows={4} placeholder="Synthèse des points forts et axes d'amélioration..." value={globalComment} onChange={e => setGlobalComment(e.target.value)}></textarea>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button onClick={onCancel} className="px-6 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-100">Annuler</button>
                        <button onClick={() => {
                            if (!selectedStudent) return alert('Sélectionnez un candidat');
                            onSave({
                                id: initialData ? initialData.id : Date.now(),
                                studentId: parseInt(selectedStudent),
                                date: initialData ? initialData.date : new Date().toISOString(),
                                ratings,
                                globalComment
                            });
                        }} className="px-8 py-3 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black font-bold flex items-center gap-2">
                            <Save size={18} /> {initialData ? "Mettre à jour CCF" : "Valider le CCF"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
