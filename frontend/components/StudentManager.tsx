import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, UploadCloud, Trash2, AlertTriangle, Eraser, Trash } from "lucide-react";
import * as xlsx from 'xlsx';

interface StudentManagerProps {
    students: any[];
    onAdd: (students: any[]) => void;
    onRemove: (id: number) => void;
    onBack: () => void;
    onClearAll: () => void;
    onReset: () => void;
}

export default function StudentManager({ students, onAdd, onRemove, onBack, onClearAll, onReset }: StudentManagerProps) {
    const [newName, setNewName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            onAdd([{ id: Date.now(), name: newName.trim().toUpperCase() }]);
            setNewName('');
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;

            let names: string[] = [];

            try {
                // Determine file type simply by extension or try both
                if (file.name.endsWith('.csv')) {
                    // Simple CSV Parse
                    const text = data as string;
                    const lines = text.split(/\r\n|\n/);
                    names = lines.map(line => line.split(',')[0].trim()).filter(n => n && n.length > 1 && !n.toLowerCase().includes('nom'));
                } else {
                    // Excel (xlsx)
                    // Need to read as array buffer for modern xlsx usage usually, but binary string works with 'binary' type
                    const workbook = xlsx.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const json: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

                    names = json
                        .map(row => row[0]) // Assumes name is in first column
                        .filter((name: any) => name && typeof name === 'string' && name.trim().length > 0 && name.toLowerCase() !== 'nom');
                }

                if (names.length > 0) {
                    const parsedData = names.map(name => ({
                        id: Date.now() + Math.random(),
                        name: name.trim().toUpperCase()
                    }));
                    onAdd(parsedData);
                    alert(`${parsedData.length} étudiants importés avec succès !`);
                } else {
                    alert("Aucun nom trouvé. Vérifiez que les noms sont dans la première colonne.");
                }

            } catch (error) {
                console.error("Import Error:", error);
                alert("Erreur lors de la lecture du fichier. Vérifiez le format.");
            }
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="animate-slide-up max-w-4xl mx-auto space-y-8">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft size={20} /> Retour au tableau de bord
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="text-indigo-600" /> Gestion des Étudiants
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ajout Manuel */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">Ajout Manuel</h3>
                        <form onSubmit={handleManualAdd} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Nom Prénom"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>

                    {/* Import Excel */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">Import Excel / CSV</h3>
                        <div
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput')?.click()}
                        >
                            <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Cliquez ou glissez un fichier ici</p>
                            <p className="text-xs text-gray-400 mt-1">(.xlsx, .xls, .csv)</p>
                            <input
                                id="fileInput"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>
                </div>

                {/* Liste Actuelle */}
                <div className="mt-10">
                    <h3 className="font-semibold text-gray-700 mb-4">Liste de la classe ({students.length})</h3>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto border border-gray-100">
                        {students.length === 0 ? (
                            <p className="text-center text-gray-400 py-4">Aucun étudiant dans la liste.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                                    <li key={student.id} className="flex justify-between items-center py-3 px-2 hover:bg-white rounded-lg transition-colors">
                                        <span className="font-medium text-gray-700">{student.name}</span>
                                        <button
                                            onClick={() => { if (confirm('Supprimer cet étudiant ?')) onRemove(student.id); }}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Zone de Danger */}
                <div className="mt-10 pt-8 border-t border-gray-200">
                    <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} /> Zone de Danger
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => { if (confirm('ATTENTION : Voulez-vous vraiment supprimer TOUTES les évaluations (notes et commentaires) ? La liste des étudiants sera conservée.')) onClearAll(); }}
                            className="flex-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-3 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Eraser size={16} /> Vider toutes les évaluations
                        </button>
                        <button
                            onClick={() => { if (confirm('ATTENTION IRRÉVERSIBLE : Voulez-vous vraiment TOUT effacer (étudiants et évaluations) pour repartir de zéro ?')) onReset(); }}
                            className="flex-1 bg-red-600 text-white hover:bg-red-700 px-4 py-3 rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Trash size={16} /> Réinitialisation Totale
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
