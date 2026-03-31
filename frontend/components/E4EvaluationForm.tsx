import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Award, Save, FileText, Target, Users, Printer } from "lucide-react";
import { calculateGrade } from '../app/types';
import { exportHTMLToWord } from '../app/lib/exportUtils';

// Structure conforme à l'Annexe V-4 de la circulaire officielle
const E4_GRILLE = {
    situationA: {
        id: 'E4_SITUATION_A',
        title: "Cibler et prospecter la clientèle",
        skills: [
            { id: 'E4.CIBLER_1', name: "Analyser un portefeuille client", desc: "Pertinence de l'analyse du portefeuille clients, qualification pertinente des prospects" },
            { id: 'E4.CIBLER_2', name: "Identifier des cibles de clientèle", desc: "Cohérence entre ciblage et démarche de prospection" },
            { id: 'E4.CIBLER_3', name: "Mettre en œuvre et évaluer une démarche de prospection", desc: "Efficacité des choix opérés" },
            { id: 'E4.CIBLER_4', name: "Développer des réseaux professionnels", desc: "Activation pertinente des réseaux professionnels" }
        ]
    },
    situationB_Nego: {
        id: 'E4_SITUATION_B_NEGO',
        title: "Négocier et accompagner la relation client",
        skills: [
            { id: 'E4.NEGOCIER_1', name: "Négocier et vendre une solution adaptée au client", desc: "Maîtrise de la relation interpersonnelle, efficacité de la négociation commerciale, pertinence de la solution proposée" },
            { id: 'E4.NEGOCIER_2', name: "Créer et maintenir une relation client durable", desc: "Personnalisation de la relation client, qualité du diagnostic et de l'accompagnement client, respect des engagements, évolutivité et enrichissement de la relation client" }
        ]
    },
    situationB_Event: {
        id: 'E4_SITUATION_B_EVENT',
        title: "Organiser et animer un évènement commercial",
        skills: [
            { id: 'E4.EVENT_1', name: "Organiser un évènement commercial", desc: "Pertinence du choix de l'événement commercial, efficacité de l'organisation au regard des contraintes logistiques, financières, commerciales" },
            { id: 'E4.EVENT_2', name: "Animer un évènement commercial", desc: "Qualité et efficacité de l'animation" },
            { id: 'E4.EVENT_3', name: "Exploiter un évènement commercial", desc: "Précision du bilan quantitatif et qualitatif de l'événement commercial, rigueur dans le suivi des contacts et des opportunités d'affaires" }
        ]
    },
    transversal: {
        id: 'E4_TRANSVERSAL',
        title: "Exploiter et mutualiser l'information commerciale",
        skills: [
            { id: 'E4.INFO_1', name: "Remonter, valoriser et partager l'information commerciale", desc: "Pertinence et qualité des informations collectées, sélection et hiérarchisation de l'information diffusée" },
            { id: 'E4.INFO_2', name: "Collaborer à l'interne en vue de développer l'expertise commerciale", desc: "Qualité des analyses commerciales et des propositions" }
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
    const selectedStudentData = useMemo(() => students.find(s => s.id.toString() === selectedStudent), [students, selectedStudent]);

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
        <div key={skill.id} className="bg-white p-4 print:p-2 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all flex flex-col md:flex-row justify-between gap-4 items-center shadow-sm print:shadow-none print:border-b print:border-gray-300 print:rounded-none print:break-inside-avoid">
            <div className="flex-1 print:flex-1">
                <div className="font-semibold text-gray-800 print:text-sm">{skill.name}</div>
                <div className="text-xs text-gray-500 mt-1">{skill.desc}</div>
            </div>
            <div className="flex gap-1 print:gap-4 print:items-center">
                <div className="hidden print:flex text-xs font-bold text-gray-400 w-full justify-between px-2 mb-1">
                    <span>TI</span><span>I</span><span>S</span><span>TS</span>
                </div>
                {RATINGS.map(r => (
                    <button
                        key={r.id}
                        onClick={() => setRatings(prev => ({ ...prev, [skill.id]: r.id }))}
                        className={`w-10 h-10 print:w-auto print:h-auto print:bg-transparent rounded-lg flex items-center justify-center text-sm font-bold transition-all ${ratings[skill.id] === r.id ? r.activeColor + ' ring-2 ring-offset-2 ring-indigo-500 print:text-black print:ring-0' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 print:text-transparent print:border-none'}`}
                    >
                        <span className="print:hidden">{r.label}</span>
                        <span className="hidden print:inline-block font-normal border border-black w-4 h-4 text-center leading-3">
                            {ratings[skill.id] === r.id ? 'X' : ''}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div id="ccf-grid-e4-print" className="max-w-5xl mx-auto animate-fade-in pb-20 print:bg-white print:text-black print:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium text-sm">
                    <ArrowLeft size={18} /> Retour
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold flex items-center gap-2 transition-colors print:hidden"
                        disabled={!selectedStudent}
                        title="Imprimer ou enregistrer en PDF via le navigateur"
                    >
                        <Printer size={18} /> Imprimer / PDF
                    </button>
                    <button
                        onClick={() => {
                            const name = selectedStudentData?.name?.replace(/ /g, '_') || 'etudiant';
                            exportHTMLToWord('ccf-grid-e4-print', `CCF_E4_${name}`);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-2 transition-colors print:hidden"
                        disabled={!selectedStudent}
                    >
                        Word (.doc)
                    </button>
                    <button onClick={() => {
                        if (!selectedStudent) return alert('Sélectionnez un candidat');
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
                    }} className="px-6 py-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black font-bold flex items-center gap-2">
                        <Save size={18} /> {initialData?.id ? "Mettre à jour le CCF" : "Valider le CCF"}
                    </button>
                </div>
            </div>

            {/* EN-TÊTE OFFICIEL POUR IMPRESSION */}
            <div className="hidden print:block mb-6">
                <div className="text-center font-bold mb-6">
                    <div className="text-xl uppercase">BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT</div>
                    <div className="text-lg uppercase mt-1">E4 – RELATION CLIENT ET NÉGOCIATION-VENTE</div>
                    <div className="mt-4">
                        Évaluation en CCF - Coefficient 5
                    </div>
                </div>

                <div className="border border-black p-4 mb-4 font-bold grid grid-cols-2 gap-4 text-sm">
                    <div>
                        NOM du CANDIDAT : <span className="font-normal uppercase">{selectedStudentData?.name?.split(' ')[0] || ''}</span>
                    </div>
                    <div>
                        Prénom du candidat : <span className="font-normal capitalize">{selectedStudentData?.name?.split(' ').slice(1).join(' ') || ''}</span>
                    </div>
                    <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-gray-400 space-y-1 text-xs">
                        <div>Structure de stage ou d'alternance : <span className="font-normal">{context.orgName || '..............................................'}</span></div>
                        <div>Offre Commerciale : <span className="font-normal">{context.offre || '..............................................'}</span></div>
                        <div>Type de Clientèle : <span className="font-normal">{context.clientele || '..............................................'}</span></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                {/* Colonne Gauche : Info Candidat & Contexte */}
                <div className="lg:col-span-1 space-y-6 print:hidden">
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
                                disabled={!!initialData?.id}
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
                <div className="lg:col-span-2 space-y-8 print:space-y-4">

                    {/* Situation A */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden print:p-0 print:border-none print:shadow-none print:break-inside-avoid">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 print:hidden"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-sm print:bg-gray-100 print:p-2 print:border print:border-black print:mb-2">
                            <Target className="text-blue-500 print:hidden" /> {E4_GRILLE.situationA.title}
                        </h3>
                        <div className="space-y-3 print:space-y-0 print:border print:border-black print:border-t-0 p-2 print:p-2">
                            {E4_GRILLE.situationA.skills.map(renderSkillRow)}
                        </div>
                    </div>

                    {/* Situation B - Choix */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden print:p-0 print:border-none print:shadow-none print:break-inside-avoid">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 print:hidden"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:mb-2 print:bg-gray-100 print:p-2 print:border print:border-black">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 print:text-sm">
                                <Award className="text-purple-500 print:hidden" /> {situationBType === 'nego' ? E4_GRILLE.situationB_Nego.title : E4_GRILLE.situationB_Event.title}
                            </h3>
                            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium print:hidden">
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

                        <div className="space-y-3 animate-fade-in print:space-y-0 print:border print:border-black print:border-t-0 print:p-2">
                            {situationBType === 'nego'
                                ? E4_GRILLE.situationB_Nego.skills.map(renderSkillRow)
                                : E4_GRILLE.situationB_Event.skills.map(renderSkillRow)
                            }
                        </div>
                    </div>

                    {/* Transversal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden print:p-0 print:border-none print:shadow-none print:break-inside-avoid">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 print:hidden"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-sm print:bg-gray-100 print:p-2 print:border print:border-black print:mb-2 text-orange-600 print:text-black">
                            <FileText className="print:hidden" /> {E4_GRILLE.transversal.title}
                        </h3>
                        <div className="space-y-3 print:space-y-0 print:border print:border-black print:border-t-0 print:p-2">
                            {E4_GRILLE.transversal.skills.map(renderSkillRow)}
                        </div>
                    </div>

                    {/* Commentaire et Validation */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 print:mt-8 print:p-4 print:bg-white print:border-black">
                        <label className="block text-sm font-bold text-gray-700 mb-2 print:text-black">Appréciation Globale de la commission d'évaluation</label>
                        <div className="hidden print:block text-sm italic min-h-[100px]">{globalComment}</div>

                        <textarea
                            className="w-full p-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-gray-900 outline-none transition-shadow print:hidden"
                            rows={4}
                            placeholder="Points forts, axes de progrès..."
                            value={globalComment}
                            onChange={e => setGlobalComment(e.target.value)}
                        ></textarea>

                        <div className="hidden print:flex justify-between items-end mt-12 mb-4 px-8 text-sm font-bold">
                            <div className="text-center">NOTE SUR 20 : <span className="text-2xl border-b border-black inline-block min-w-[60px] ml-2">{currentGrade}</span></div>
                            <div>Signatures des membres :</div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 print:hidden">
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
                                <Save size={18} /> Valider le CCF E4
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
