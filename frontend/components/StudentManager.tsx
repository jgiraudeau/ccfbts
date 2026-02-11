import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, UploadCloud, Trash2, AlertTriangle, Eraser, Trash, Info, Download } from "lucide-react";
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

            try {
                let rows: any[][] = [];

                if (file.name.endsWith('.csv')) {
                    const text = data as string;
                    rows = text.split(/\r\n|\n/).map(line => line.split(/[;,]/).map(c => c.trim())); // Support ; or , separator
                } else {
                    const workbook = xlsx.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
                }

                // Analyze Header (First Row)
                let nameIdx = -1;
                let surnameIdx = -1;
                let classIdx = -1;
                let startRow = 0;

                if (rows.length > 0) {
                    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const header = rows[0].map(c => normalize(String(c)));

                    // Try to find 'nom', 'prenom', and 'classe'
                    surnameIdx = header.findIndex(h => h === 'nom' || h === 'noms');
                    nameIdx = header.findIndex(h => h.includes('prenom'));
                    classIdx = header.findIndex(h => h.includes('classe') || h.includes('groupe') || h.includes('section'));

                    // If we found headers, start from row 1
                    if (surnameIdx !== -1 || nameIdx !== -1 || classIdx !== -1) {
                        startRow = 1;
                    }
                }

                const parsedData = [];

                for (let i = startRow; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    let fullName = "";
                    let className = "";

                    if (surnameIdx !== -1 && nameIdx !== -1) {
                        // We have both columns identified
                        const nom = row[surnameIdx];
                        const prenom = row[nameIdx];
                        if (nom) fullName = `${nom} ${prenom || ''}`;
                    } else if (surnameIdx !== -1) {
                        // Only Nom found
                        fullName = row[surnameIdx];
                    } else if (nameIdx !== -1) {
                        // Only Prenom found
                        fullName = row[nameIdx];
                    } else {
                        // No headers detected, falling back to heuristics
                        const rowStr = row.join(' ').toLowerCase();
                        if (rowStr.includes('prénom') && rowStr.includes('nom')) continue;

                        if (row.length >= 2) {
                            const p1 = row[0] || ""; // Prénom
                            const p2 = row[1] || ""; // Nom
                            fullName = `${p2} ${p1}`;

                            // If 3 columns and no header, maybe the 3rd is the class?
                            if (row.length >= 3 && classIdx === -1) {
                                className = String(row[2]).trim();
                            }
                        } else if (row.length === 1) {
                            fullName = row[0];
                        }
                    }

                    // Extract class if column was identified
                    if (classIdx !== -1 && row[classIdx]) {
                        className = String(row[classIdx]).trim();
                    }

                    if (fullName && typeof fullName === 'string' && fullName.trim().length > 1) {
                        // Cleanup
                        const cleanName = fullName.replace(/\s+/g, ' ').trim().toUpperCase();
                        // Avoid adding header line if it slipped through
                        if (!cleanName.includes('NOM') || !cleanName.includes('PRENOM')) {
                            parsedData.push({
                                id: Date.now() + Math.random(),
                                name: cleanName,
                                className: className // Added class information
                            });
                        }
                    }
                }

                if (parsedData.length > 0) {
                    onAdd(parsedData);
                    alert(`${parsedData.length} étudiants importés avec succès !`);
                } else {
                    alert("Aucun étudiant trouvé. Vérifiez le format (Colonnes: Nom, Prénom)");
                }

            } catch (error) {
                console.error("Import Error:", error);
                alert("Erreur lecture fichier.");
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

    const downloadTemplate = () => {
        const data = [
            ["Nom", "Prénom", "Classe"],
            ["MOREAU", "Camille", "BTS NDRC 1A"],
            ["DUCHAMP", "Julien", "BTS NDRC 1A"],
            ["LEROY", "Sophie", "BTS NDRC 1B"]
        ];
        const ws = xlsx.utils.aoa_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Modèle Import");
        xlsx.writeFile(wb, "modele_import_etudiants.xlsx");
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
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-700">Import Excel / CSV</h3>
                            <button
                                onClick={downloadTemplate}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
                            >
                                <Download size={14} /> Télécharger le modèle
                            </button>
                        </div>
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
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-xs text-blue-700 leading-relaxed">
                            <Info size={16} className="shrink-0 text-blue-500" />
                            <p>
                                <strong>Astuce :</strong> Le système détecte automatiquement les colonnes "Nom", "Prénom" et "Classe". Les nouvelles classes seront créées automatiquement.
                            </p>
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
