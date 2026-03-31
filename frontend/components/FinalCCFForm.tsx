import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Award, Save, Printer } from "lucide-react";
import { calculateGrade, RATINGS } from '../app/types';
import { exportHTMLToWord } from '../app/lib/exportUtils';

// Structure conforme à l'Annexe VII-2 de la circulaire officielle
const CCF_GRILLE = {
    title: "GRILLE D'AIDE À L'ÉVALUATION - CCF",
    sections: [
        {
            id: 'E6_DISTRIBUTION',
            title: "Implanter et promouvoir l'offre chez les distributeurs",
            skills: [
                { id: 'ccf_distrib_1', name: "Valoriser l'offre sur le lieu de vente", desc: "Rigueur dans le suivi de l'application des accords de référencement, utilisation pertinente des techniques d'implantation et de valorisation des produits" },
                { id: 'ccf_distrib_2', name: "Développer la présence dans le réseau de distributeurs", desc: "Repérage des opportunités de référencement, qualité du diagnostic rayon, réseau et zone de prospection, pertinence des propositions et des actions pour développer la présence de la marque/produit" }
            ]
        },
        {
            id: 'E6_PARTENARIAT',
            title: "Développer et piloter un réseau de partenaires",
            skills: [
                { id: 'ccf_part_1', name: "Participer au développement d'un réseau de partenaires", desc: "Pertinence de la sélection de partenaires" },
                { id: 'ccf_part_2', name: "Mobiliser un réseau de partenaires et évaluer les performances", desc: "Efficience et rentabilité des actions de dynamisation du réseau" }
            ]
        },
        {
            id: 'E6_VD',
            title: "Créer et animer un réseau de vente directe",
            skills: [
                { id: 'ccf_vd_1', name: "Prospecter, organiser des rencontres et vendre en réunion", desc: "Développement du fichier des conseillers, professionnalisme et efficacité commerciale lors des ventes en réunion" },
                { id: 'ccf_vd_2', name: "Recruter et former des vendeurs à domicile", desc: "Pertinence et efficacité des actions de recrutement et de formation" },
                { id: 'ccf_vd_3', name: "Impulser une dynamique de réseau", desc: "Cohérence de l'animation réseau avec les orientations commerciales, respect de la réglementation et de l'éthique" }
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
    const selectedStudentData = useMemo(() => students.find(s => s.id.toString() === selectedStudent), [students, selectedStudent]);

    useEffect(() => {
        if (initialData) {
            setSelectedStudent(initialData.studentId.toString());
            setRatings(initialData.ratings || {});
            setGlobalComment(initialData.globalComment || '');
        }
    }, [initialData]);

    return (
        <div id="ccf-grid-print" className="max-w-4xl mx-auto animate-slide-up print:max-w-none print:w-full print:bg-white print:text-black">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <button onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
                    <ArrowLeft size={20} /> Retour
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
                            exportHTMLToWord('ccf-grid-print', `CCF_E6_${name}`);
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
                            ratings,
                            globalComment
                        });
                    }} className="px-6 py-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black font-bold flex items-center gap-2">
                        <Save size={18} /> {initialData?.id ? "Mettre à jour" : "Valider"}
                    </button>
                </div>
            </div>

            {/* EN-TÊTE OFFICIEL POUR IMPRESSION */}
            <div className="hidden print:block mb-8">
                <div className="text-center font-bold mb-6">
                    <div className="text-xl uppercase">BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT</div>
                    <div className="text-lg uppercase mt-1">E6 – RELATION CLIENT ET ANIMATION DE RÉSEAUX</div>
                    <div className="mt-4">
                        Évaluation en CCF - Durée 30 MINUTES - Coefficient 3
                    </div>
                    <div className="mt-2 text-lg underline">
                        Grille d&apos;aide à l&apos;Évaluation – Session 2026
                    </div>
                </div>

                <div className="border border-black p-4 mb-4 font-bold grid grid-cols-2 gap-4 text-sm">
                    <div>
                        NOM du CANDIDAT : <span className="font-normal uppercase">{selectedStudentData?.name?.split(' ')[0] || ''}</span>
                    </div>
                    <div>
                        Prénom du candidat : <span className="font-normal capitalize">{selectedStudentData?.name?.split(' ').slice(1).join(' ') || ''}</span>
                    </div>
                    <div className="col-span-2">
                        Dates Situation A : .............................................. Situation B : ..............................................
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                <div className="bg-gray-900 text-white p-8 relative print:hidden">
                    <h2 className="text-2xl font-bold flex items-center gap-3"><Award /> {initialData?.id ? "Modifier l'Évaluation de CCF" : "Évaluation de CCF - Session 2026"}</h2>
                    <p className="text-gray-400 mt-1">Grille officielle consolidée (Distribution, Partenariat, VD)</p>
                    <div className="absolute top-8 right-8 bg-white/10 backdrop-blur rounded-lg p-3 text-center border border-white/20">
                        <div className="text-4xl font-bold text-yellow-400">{currentGrade || '--'}</div>
                        <div className="text-xs text-gray-300">NOTE FINALE / 20</div>
                    </div>
                </div>

                <div className="p-8 print:p-0">
                    <div className="mb-8 print:hidden">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Candidat</label>
                        <select
                            className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 font-medium text-lg focus:ring-2 focus:ring-gray-900 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            value={selectedStudent}
                            onChange={e => setSelectedStudent(e.target.value)}
                            disabled={!!initialData?.id}
                        >
                            <option value="">Sélectionner le candidat...</option>
                            {students.sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-10 print:hidden">
                        {/* EN-TÊTE DU TABLEAU A L'IMPRESSION */}
                        <div className="hidden print:grid grid-cols-12 gap-2 border-b-2 border-black pb-2 font-bold text-center text-xs">
                            <div className="col-span-8 text-left">CRITÈRES D&apos;ÉVALUATION et COMPÉTENCES</div>
                            <div className="col-span-1 border-l border-black overflow-hidden truncate">TI</div>
                            <div className="col-span-1 border-l border-black overflow-hidden truncate">I</div>
                            <div className="col-span-1 border-l border-black overflow-hidden truncate">S</div>
                            <div className="col-span-1 border-l border-black overflow-hidden truncate">TS</div>
                        </div>

                        {CCF_GRILLE.sections.map(section => (
                            <div key={section.id} className="border-t border-gray-100 pt-6 print:pt-2 print:border-none print:break-inside-avoid">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-sm print:mb-2 print:uppercase print:bg-gray-200 print:px-2 print:py-1 print:border print:border-black">
                                    <span className="w-1 h-6 bg-gray-900 rounded-full print:hidden"></span> {section.title}
                                </h3>
                                <div className="grid gap-4 print:gap-0">
                                    {section.skills.map(skill => (
                                        <div key={skill.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors print:bg-white print:p-0 print:border-none print:border-b print:border-gray-400 print:rounded-none">

                                            {/* AFFICHAGE ECRAN */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
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

                    {/* GRILLE IMPRESSION (TABLE HTML PURE POUR WORD) */}
                    <table className="hidden print:table w-full border-collapse border border-black text-xs mb-6 break-inside-avoid">
                        <thead>
                            <tr className="border-b-2 border-black bg-gray-100">
                                <th className="border-r border-black p-2 text-left">CRITÈRES D'ÉVALUATION et COMPÉTENCES</th>
                                <th className="border-r border-black p-2 w-[40px] text-center">TI</th>
                                <th className="border-r border-black p-2 w-[40px] text-center">I</th>
                                <th className="border-r border-black p-2 w-[40px] text-center">S</th>
                                <th className="p-2 w-[40px] text-center">TS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CCF_GRILLE.sections.map(section => (
                                <React.Fragment key={section.id}>
                                    <tr>
                                        <td colSpan={5} className="border border-black p-2 font-bold bg-gray-200 uppercase text-center">
                                            {section.title}
                                        </td>
                                    </tr>
                                    {section.skills.map(skill => (
                                        <tr key={`print-${skill.id}`} className="border-b border-black break-inside-avoid">
                                            <td className="border-r border-black p-2">
                                                <div className="font-bold">{skill.name}</div>
                                                <div className="italic text-[10px] text-gray-700">({skill.desc})</div>
                                            </td>
                                            {RATINGS.map(r => (
                                                <td key={`print-${skill.id}-${r.id}`} className="border-r border-black p-2 text-center font-bold text-lg align-middle">
                                                    {ratings[skill.id] === r.id ? 'X' : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-8 pt-6 border-t border-gray-200 print:hidden">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Appréciation Générale du Jury</label>
                        <textarea className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-gray-900 outline-none" rows={4} placeholder="Synthèse des points forts et axes d'amélioration..." value={globalComment} onChange={e => setGlobalComment(e.target.value)}></textarea>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 print:hidden">
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
                            <Save size={18} /> {initialData?.id ? "Mettre à jour le CCF" : "Valider le CCF"}
                        </button>
                    </div>

                    {/* BAS DE PAGE OFFICIEL POUR IMPRESSION */}
                    <div className="hidden print:block mt-8 pt-4">
                        <div className="text-xs italic mb-4">TI : Très Insuffisant / I : Insuffisant / S : Satisfaisant /TS : Très satisfaisant</div>

                        <div className="border border-black p-4 flex justify-between h-48">
                            <div className="w-2/3">
                                <div className="font-bold underline mb-2">Appréciation de la commission :</div>
                                <div className="text-sm whitespace-pre-wrap">{globalComment}</div>
                            </div>
                            <div className="w-1/3 border-l border-black pl-4 flex flex-col items-center justify-center">
                                <div className="font-bold mb-2">NOTE sur 20</div>
                                <div className="text-3xl font-bold border-2 border-black w-24 h-24 flex items-center justify-center rounded-full">
                                    {currentGrade}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="font-bold mb-4">Nom et signature des membres de la commission :</div>
                            <div className="grid grid-cols-2 gap-8 h-24">
                                <div className="border-b border-dotted border-gray-400">1.</div>
                                <div className="border-b border-dotted border-gray-400">2.</div>
                            </div>
                        </div>

                        <div className="text-[10px] text-center italic mt-12 text-gray-600">
                            Ce document d&apos;aide à l&apos;évaluation est à usage exclusif de la commission d&apos;interrogation,<br />il ne doit pas être communiqué au candidat.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
