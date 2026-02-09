
import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Wand2, Copy, AlertCircle } from 'lucide-react';

interface ScenarioGeneratorProps {
    onBack: () => void;
    blockType: 'E4' | 'E6';
}

export default function ScenarioGenerator({ onBack, blockType }: ScenarioGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [scenarioType, setScenarioType] = useState('jeu_de_role_evenement'); // Default to Event
    const [generatedContent, setGeneratedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refineInstruction, setRefineInstruction] = useState('');
    const [refining, setRefining] = useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setError('');
        setGeneratedContent('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${API_URL}/api/course`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    document_type: scenarioType,
                    category: 'NDRC', // Hardcoded for now
                    duration_hours: 4 // Default
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Erreur lors de la génération');
            }

            const data = await response.json();
            setGeneratedContent(data.content);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefine = async () => {
        if (!generatedContent || !refineInstruction) return;
        setRefining(true);
        setError('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${API_URL}/api/refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_content: generatedContent,
                    instruction: refineInstruction,
                    track: 'NDRC'
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Erreur lors de la modification');
            }

            const data = await response.json();
            setGeneratedContent(data.content);
            setRefineInstruction(''); // Clear instruction after success
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setRefining(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
        alert('Copié dans le presse-papier !');
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition-colors">
                <ArrowLeft size={18} /> Retour au tableau de bord
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 relative z-10">
                        <Wand2 /> Générateur de Scénarios {blockType} (IA)
                    </h2>
                    <p className="text-purple-100 mt-2 relative z-10 max-w-xl">
                        Créez instantanément des sujets d'examen officiels conformes au référentiel {blockType}.
                    </p>
                </div>

                <div className="p-8">
                    <div className="grid gap-6 md:grid-cols-2 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Type de Sujet</label>
                            <select
                                value={scenarioType}
                                onChange={(e) => setScenarioType(e.target.value)}
                                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="jeu_de_role_evenement">Situation B : Évènement Commercial</option>
                                <option value="jeu_de_role">Situation A : Négociation Vente</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Contenu de la Fiche Situation Étudiant / Contexte</label>
                            <textarea
                                placeholder="Copiez-collez ici le contenu de la fiche situation de l'étudiant (Contexte, Produit, Cible, Objectifs...)"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none h-40"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !topic}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:scale-[1.01]'}`}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                Génération en cours...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} /> Générer le Sujet
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {generatedContent && (
                        <div className="mt-10 animate-slide-up space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-800">Sujet Généré</h3>
                                <button onClick={copyToClipboard} className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                                    <Copy size={16} /> Copier
                                </button>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 font-mono text-sm whitespace-pre-wrap text-gray-800 shadow-inner max-h-[600px] overflow-y-auto">
                                {generatedContent}
                            </div>

                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 space-y-4">
                                <h4 className="font-bold text-purple-900 flex items-center gap-2">
                                    <Wand2 size={18} /> Affiner / Modifier le Sujet
                                </h4>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Ex: Rends le client plus agressif, Ajoute une objection sur le prix..."
                                        value={refineInstruction}
                                        onChange={(e) => setRefineInstruction(e.target.value)}
                                        className="flex-1 p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                    />
                                    <button
                                        onClick={handleRefine}
                                        disabled={refining || !refineInstruction}
                                        className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${refining ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                                    >
                                        {refining ? 'Modification...' : 'Modifier'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
