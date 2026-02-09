import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Award, Save, FileText, Target, Users } from "lucide-react";
import { calculateGrade } from '../app/types';

// Structure E4
const E4_GRILLE = {
    situationA: {
        id: 'E4_SITUATION_A',
        title: "Situation A : Cibler et prospecter la clientèle",
        skills: [
            { id: 'E4.CIBLER_1', name: "Analyser un portefeuille clients", desc: "Pertinence analyse, qualification prospects" },
            { id: 'E4.CIBLER_2', name: "Identifier des cibles de clientèle", desc: "Cohérence ciblage/démarche" },
            { id: 'E4.CIBLER_3', name: "Mettre en oeuvre une démarche de prospection", desc: "Efficacité choix opérés" },
            { id: 'E4.CIBLER_4', name: "Développer des réseaux professionnels", desc: "Activation pertinente réseaux" }
        ]
    },
    situationB_Nego: {
        id: 'E4_SITUATION_B_NEGO',
        title: "Situation B : Négociation-Vente",
        skills: [
            { id: 'E4.NEGOCIER_1', name: "Négocier et vendre une solution", desc: "Relationnel, efficacité négo, pertinence solution" },
            { id: 'E4.NEGOCIER_2', name: "Créer et maintenir une relation durable", desc: "Personnalisation, diagnostic, respect engagements" }
        ]
    },
    situationB_Event: {
        id: 'E4_SITUATION_B_EVENT',
        title: "Situation B : Évènement Commercial",
        skills: [
            { id: 'E4.EVENT_1', name: "Organiser un évènement commercial", desc: "Pertinence choix, logistique/finance" },
            { id: 'E4.EVENT_2', name: "Animer un évènement commercial", desc: "Qualité et efficacité animation" },
            { id: 'E4.EVENT_3', name: "Exploiter un évènement commercial", desc: "Bilan quanti/quali, suivi contacts" }
        ]
    },
    transversal: {
        id: 'E4_TRANSVERSAL',
        title: "Exploiter et mutualiser l'information commerciale",
        skills: [
            { id: 'E4.INFO_1', name: "Remonter et partager l'info", desc: "Qualité collecte, hiérarchisation diffusion" },
            { id: 'E4.INFO_2', name: "Collaborer au développement de l'expertise", desc: "Qualité analyses et propositions" }
        ]
    }
};

const RATINGS = [
    { id: 'TI', label: 'TI', value: 0, activeColor: 'bg-red-500 text-white' },
    { id: 'I', label: 'I', value: 7, activeColor: 'bg-orange-500 text-white' },
    { id: 'S', label: 'S', value: 14, activeColor: 'bg-blue-500 text-white' },
    { id: 'TS', label: 'TS', value: 20, activeColor: 'bg-green-500 text-white' }
];

interface E4EvaluationFormProps {
    students: any[];
    onSave: (data: any) => void;
    onCancel: () => void;
    initialData: any;
}

export default function E4EvaluationForm({ students, onSave, onCancel, initialData }: E4EvaluationFormProps) {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [ratings, setRatings] = useState<Record<string, string>>({});
    const [globalComment, setGlobalComment] = useState('');
    const [situationBType, setSituationBType] = useState<'nego' | 'event'>('nego');

    // Champs Fiche Descriptive
    const [context, setContext] = useState({
        orgName: '',
        typeStructure: '',
        offre: '',
        clientele: ''
    });

    const currentGrade = useMemo(() => calculateGrade(ratings), [ratings]);

    useEffect(() => {
        if (initialData) {
            setSelectedStudent(initialData.studentId.toString());
            setRatings(initialData.ratings || {});
            setGlobalComment(initialData.globalComment || '');
            if (initialData.context) setContext(initialData.context);
            if (initialData.situationBType) setSituationBType(initialData.situationBType);
        }
    }, [initialData]);

    const renderSkillRow = (skill: any) => (
        <div key={skill.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all flex flex-col md:flex-row justify-between gap-4 items-center shadow-sm">
            <div className="flex-1">
                <div className="font-semibold text-gray-800">{skill.name}</div>
                <div className="text-xs text-gray-500 mt-1">{skill.desc}</div>
            </div>
            <div className="flex gap-1">
                {RATINGS.map(r => (
                    <button
                        key={r.id}
                        onClick={() => setRatings(prev => ({ ...prev, [skill.id]: r.id }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${ratings[skill.id] === r.id ? r.activeColor + ' ring-2 ring-offset-2 ring-indigo-500' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium text-sm">
                    <ArrowLeft size={18} /> Retour au tableau de bord
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne Gauche : Info Candidat & Contexte */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="text-indigo-600" size={20} /> Candidat
                        </h3>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Étudiant</label>
                            <select
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={selectedStudent}
                                onChange={e => setSelectedStudent(e.target.value)}
                                disabled={!!initialData}
                            >
                                <option value="">Choisir...</option>
                                {students.sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FileText size={16} /> Contexte Fiche E4
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Organisation</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 text-sm border border-gray-200 rounded bg-white"
                                        placeholder="Ex: Agence Immo..."
                                        value={context.orgName}
                                        onChange={e => setContext({ ...context, orgName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Offre Commerciale</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 text-sm border border-gray-200 rounded bg-white"
                                        placeholder="Ex: Mandat exclusif..."
                                        value={context.offre}
                                        onChange={e => setContext({ ...context, offre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Type de Clientèle</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 text-sm border border-gray-200 rounded bg-white"
                                        placeholder="Ex: Propriétaires..."
                                        value={context.clientele}
                                        onChange={e => setContext({ ...context, clientele: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-900 text-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-sm text-indigo-200 font-medium mb-1">NOTE PROVISOIRE</div>
                        <div className="text-5xl font-bold mb-2">{currentGrade || '--'}</div>
                        <div className="text-xs text-indigo-300">SUR 20 POINTS</div>
                    </div>
                </div>

                {/* Colonne Droite : Grille d'évaluation */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Situation A */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Target className="text-blue-500" /> {E4_GRILLE.situationA.title}
                        </h3>
                        <div className="space-y-3">
                            {E4_GRILLE.situationA.skills.map(renderSkillRow)}
                        </div>
                    </div>

                    {/* Situation B - Choix */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Award className="text-purple-500" /> Situation B
                            </h3>
                            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                                <button
                                    onClick={() => setSituationBType('nego')}
                                    className={`px-4 py-1.5 rounded-md transition-all ${situationBType === 'nego' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Négociation
                                </button>
                                <button
                                    onClick={() => setSituationBType('event')}
                                    className={`px-4 py-1.5 rounded-md transition-all ${situationBType === 'event' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Évènement
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 animate-fade-in">
                            {situationBType === 'nego'
                                ? E4_GRILLE.situationB_Nego.skills.map(renderSkillRow)
                                : E4_GRILLE.situationB_Event.skills.map(renderSkillRow)
                            }
                        </div>
                    </div>

                    {/* Transversal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            Transversal : Information Commerciale
                        </h3>
                        <div className="space-y-3">
                            {E4_GRILLE.transversal.skills.map(renderSkillRow)}
                        </div>
                    </div>

                    {/* Commentaire et Validation */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Appréciation Globale du Jury</label>
                        <textarea
                            className="w-full p-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-gray-900 outline-none transition-shadow"
                            rows={4}
                            placeholder="Points forts, axes de progrès..."
                            value={globalComment}
                            onChange={e => setGlobalComment(e.target.value)}
                        ></textarea>

                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={onCancel} className="px-6 py-3 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors">Annuler</button>
                            <button onClick={() => {
                                if (!selectedStudent) return alert('Veuillez sélectionner un candidat');
                                onSave({
                                    id: initialData ? initialData.id : Date.now(),
                                    studentId: parseInt(selectedStudent),
                                    date: initialData ? initialData.date : new Date().toISOString(),
                                    type: 'E4',
                                    situationBType,
                                    ratings,
                                    context,
                                    globalComment
                                });
                            }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 font-bold flex items-center gap-2 transform hover:translate-y-px transition-all">
                                <Save size={18} /> Valider l'évaluation E4
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
