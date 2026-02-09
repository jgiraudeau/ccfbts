import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, TrendingUp, TrendingDown, MessageCircle, Monitor, Users, Handshake
} from "lucide-react";
import { calculateGrade, RATINGS, Domain } from '../app/types';

// TODO: Refactoriser ces DOMAINS pour éviter la duplication
const DOMAINS: Record<string, Domain> = {
    E6_DISTRIBUTION: { id: 'distrib', title: "", subtitle: "Distributeur", color: "", gradient: "from-blue-500 to-cyan-400", icon: Monitor, skills: [] },
    E6_PARTENARIAT: { id: 'partenariat', title: "", subtitle: "Partenariat", color: "", gradient: "from-emerald-500 to-teal-400", icon: Handshake, skills: [] },
    E6_VD: { id: 'vd', title: "", subtitle: "Vente Directe", color: "", gradient: "from-purple-500 to-pink-400", icon: Users, skills: [] }
};

const CCF_GRILLE = {
    sections: [
        { id: 'E6_DISTRIBUTION', skills: [{ id: 'ccf_distrib_1' }, { id: 'ccf_distrib_2' }] },
        { id: 'E6_PARTENARIAT', skills: [{ id: 'ccf_part_1' }, { id: 'ccf_part_2' }] },
        { id: 'E6_VD', skills: [{ id: 'ccf_vd_1' }, { id: 'ccf_vd_2' }] }
    ]
};

interface ComparisonViewProps {
    student: any;
    evaluations: any[];
    finalEvaluation: any;
    reflexiveData: any;
    onSaveReflexive: (studentId: number, data: any) => void;
    onBack: () => void;
}

const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarColor = (id: number) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
    return colors[id % colors.length];
};


export default function ComparisonView({ student, evaluations, finalEvaluation, reflexiveData, onSaveReflexive, onBack }: ComparisonViewProps) {
    if (!student) return null;

    // Calcul des moyennes continues par bloc
    const continuousAverages = useMemo(() => {
        const avgs: Record<string, string | null> = {};
        Object.keys(DOMAINS).forEach(domainId => {
            const domainEvals = evaluations.filter(e => e.studentId === student.id && e.domainId === domainId);
            let total = 0, count = 0;
            domainEvals.forEach(e => {
                const g = calculateGrade(e.ratings);
                if (g) { total += parseFloat(g); count++; }
            });
            avgs[domainId] = count > 0 ? (total / count).toFixed(1) : null;
        });
        return avgs;
    }, [student, evaluations]);

    // Calcul des notes finales par bloc (CCF)
    const finalScores = useMemo(() => {
        if (!finalEvaluation) return {};
        const scores: Record<string, string | null> = {};

        CCF_GRILLE.sections.forEach(section => {
            const skillIds = section.skills.map(s => s.id);
            let total = 0, count = 0;

            skillIds.forEach(sid => {
                const rId = finalEvaluation.ratings[sid];
                const r = RATINGS.find(rt => rt.id === rId);
                if (r) { total += r.value; count++; }
            });
            scores[section.id] = count > 0 ? (total / count).toFixed(1) : null;
        });
        return scores;
    }, [finalEvaluation]);

    const [reflexiveInputs, setReflexiveInputs] = useState(reflexiveData || {});

    const handleReflexiveChange = (domainId: string, text: string) => {
        setReflexiveInputs((prev: any) => ({ ...prev, [domainId]: text }));
    };

    const saveAnalysis = () => {
        onSaveReflexive(student.id, reflexiveInputs);
    };

    return (
        <div className="animate-slide-up space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft size={20} /> Retour
            </button>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${getAvatarColor(student.id)}`}>{getInitials(student.name)}</div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                        <p className="text-gray-500">Analyse des Écarts & Réflexivité</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {Object.entries(DOMAINS).map(([domainId, domainData]) => {
                    const contScore = continuousAverages[domainId];
                    const finScore = finalScores[domainId];
                    const gap = (contScore && finScore) ? (parseFloat(finScore) - parseFloat(contScore)).toFixed(1) : null;
                    const gapColor = gap && parseFloat(gap) > 0 ? 'text-green-600' : (gap && parseFloat(gap) < 0 ? 'text-red-600' : 'text-gray-500');

                    return (
                        <div key={domainId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className={`h-2 bg-gradient-to-r ${domainData.gradient}`}></div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <domainData.icon className="text-gray-400" /> {domainData.title} {domainData.subtitle}
                                </h3>

                                <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
                                    {/* Comparateur Visuel */}
                                    <div className="flex-1 w-full grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Moy. Continu</div>
                                            <div className="text-2xl font-bold text-gray-700">{contScore || '--'}</div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Écart</div>
                                            {gap !== null ? (
                                                <div className={`text-3xl font-black ${gapColor}`}>
                                                    {parseFloat(gap) > 0 ? '+' : ''}{gap}
                                                </div>
                                            ) : <div className="text-gray-300">--</div>}
                                            {gap !== null && (parseFloat(gap) >= 0 ? <TrendingUp size={16} className={gapColor} /> : <TrendingDown size={16} className={gapColor} />)}
                                        </div>
                                        <div className="bg-gray-900 text-white rounded-xl p-4 shadow-lg shadow-gray-200">
                                            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Note CCF</div>
                                            <div className="text-2xl font-bold text-yellow-400">{finScore || '--'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Zone Réflexive */}
                                <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                                    <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                        <MessageCircle size={16} /> Retour Réflexif : Analyse de l'écart
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-indigo-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        rows={3}
                                        placeholder="Pourquoi cet écart ? Quelles actions correctives ont été mises en place ou auraient dû l'être ?"
                                        value={reflexiveInputs[domainId] || ''}
                                        onChange={(e) => handleReflexiveChange(domainId, e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={saveAnalysis} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2">
                    <Save /> Enregistrer l'analyse
                </button>
            </div>
        </div>
    );
}
