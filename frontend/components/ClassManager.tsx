import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, UserPlus, X, UploadCloud, Download, Info, GraduationCap } from 'lucide-react';
import * as xlsx from 'xlsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Class {
    id: number;
    name: string;
    description: string | null;
    academic_year: string | null;
    teacher_id: number;
    created_at: string;
    student_count: number;
}

interface Student {
    id: number;
    name: string;
    email: string;
}

export default function ClassManager() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [classStudents, setClassStudents] = useState<Student[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<'classes' | 'students'>('classes');

    const [isDragging, setIsDragging] = useState(false);
    const [newName, setNewName] = useState('');

    const [newClass, setNewClass] = useState({
        name: '',
        description: '',
        academic_year: '2024-2025'
    });

    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

    useEffect(() => {
        fetchClasses();
        fetchMyStudents();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/classes`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setClasses(data);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchMyStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/students`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchClassStudents = async (classId: number) => {
        try {
            const response = await fetch(`${API_URL}/api/classes/${classId}/students`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setClassStudents(data);
            }
        } catch (error) {
            console.error('Error fetching class students:', error);
        }
    };

    const syncClasses = async () => {
        setSyncing(true);
        try {
            const response = await fetch(`${API_URL}/api/classes/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                fetchClasses();
            }
        } catch (error) {
            console.error('Error syncing classes:', error);
        } finally {
            setSyncing(false);
        }
    };

    const createClass = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newClass)
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewClass({ name: '', description: '', academic_year: '2024-2025' });
                fetchClasses();
            }
        } catch (error) {
            console.error('Error creating class:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteClass = async (classId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) return;
        try {
            const response = await fetch(`${API_URL}/api/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                fetchClasses();
                if (selectedClass?.id === classId) setSelectedClass(null);
            }
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    const removeStudent = async (studentId: number) => {
        if (!confirm('Supprimer définitivement cet élève ?')) return;
        try {
            const response = await fetch(`${API_URL}/api/students/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                fetchMyStudents();
                fetchClasses();
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const handleImport = async (parsedData: any[]) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let addedCount = 0;
        for (const s of parsedData) {
            try {
                const res = await fetch(`${API_URL}/students`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name: s.name, class_name: s.className })
                });
                if (res.ok) addedCount++;
            } catch (e) { console.error("Error importing student", s.name, e); }
        }
        alert(`${addedCount} élèves importés avec succès !`);
        fetchMyStudents();
        setLoading(false);
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) return;
            try {
                let rows: any[][] = [];
                if (file.name.endsWith('.csv')) {
                    rows = (data as string).split(/\r\n|\n/).map(line => line.split(/[;,]/).map(c => c.trim()));
                } else {
                    const workbook = xlsx.read(data, { type: 'binary' });
                    rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                }

                let nameIdx = -1, surnameIdx = -1, classIdx = -1, startRow = 0;
                if (rows.length > 0) {
                    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const header = rows[0].map(c => normalize(String(c)));
                    surnameIdx = header.findIndex(h => h === 'nom' || h === 'noms');
                    nameIdx = header.findIndex(h => h.includes('prenom'));
                    classIdx = header.findIndex(h => h.includes('classe') || h.includes('groupe'));
                    if (surnameIdx !== -1 || nameIdx !== -1) startRow = 1;
                }

                const parsed = [];
                for (let i = startRow; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;
                    let fullName = "", className = "";
                    if (surnameIdx !== -1 && nameIdx !== -1) fullName = `${row[surnameIdx]} ${row[nameIdx]}`;
                    else if (surnameIdx !== -1) fullName = row[surnameIdx];
                    else if (nameIdx !== -1) fullName = row[nameIdx];
                    else fullName = row[0];
                    if (classIdx !== -1) className = String(row[classIdx]);
                    if (fullName && String(fullName).trim().length > 1) {
                        parsed.push({ name: String(fullName).trim().toUpperCase(), className });
                    }
                }
                if (parsed.length > 0) handleImport(parsed);
                else alert("Aucun élève trouvé.");
            } catch (err) { alert("Erreur lecture fichier."); }
        };
        if (file.name.endsWith('.csv')) reader.readAsText(file);
        else reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const data = [["Nom", "Prénom", "Classe"], ["MOREAU", "Camille", "BTS NDRC 1A"]];
        const ws = xlsx.utils.aoa_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Modèle");
        xlsx.writeFile(wb, "modele_import_etudiants.xlsx");
    };

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            handleImport([{ name: newName.trim(), className: '' }]);
            setNewName('');
        }
    };

    const addStudentsToClass = async () => {
        if (!selectedClass || selectedStudentIds.length === 0) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/classes/${selectedClass.id}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ student_ids: selectedStudentIds })
            });
            if (response.ok) {
                setShowAddStudentsModal(false);
                setSelectedStudentIds([]);
                fetchClassStudents(selectedClass.id);
                fetchClasses();
            }
        } catch (error) {
            console.error('Error adding students:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeStudentFromClass = async (studentId: number) => {
        if (!selectedClass) return;
        if (!confirm('Retirer cet élève de la classe ?')) return;
        try {
            const response = await fetch(`${API_URL}/api/classes/${selectedClass.id}/students/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                fetchClassStudents(selectedClass.id);
                fetchClasses();
            }
        } catch (error) {
            console.error('Error removing student:', error);
        }
    };

    const selectClass = (cls: Class) => {
        setSelectedClass(cls);
        fetchClassStudents(cls.id);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestion Pédagogique</h1>
                        <p className="text-gray-500 mt-2 text-lg">Organisez vos classes et vos élèves</p>
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => setActiveTab('classes')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'classes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Users size={20} />
                            Mes Classes
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <GraduationCap size={20} />
                            Gérer la liste
                        </button>
                    </div>
                </div>

                {activeTab === 'classes' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-end gap-4 mb-8">
                            <button
                                onClick={syncClasses}
                                disabled={syncing}
                                className={`px-6 py-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-100 transition-all flex items-center gap-2 ${syncing ? 'opacity-50' : ''}`}
                            >
                                <Users size={20} className={syncing ? 'animate-spin' : ''} />
                                Synchroniser
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Nouvelle Classe
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Sidebar Classes */}
                            <div className="lg:col-span-1 space-y-4">
                                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-2">Vos Classes ({classes.length})</h2>
                                <div className="space-y-3">
                                    {classes.map(cls => (
                                        <div
                                            key={cls.id}
                                            onClick={() => selectClass(cls)}
                                            className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedClass?.id === cls.id ? 'border-indigo-600 bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white/50 hover:bg-white hover:border-indigo-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                                                <button onClick={(e) => { e.stopPropagation(); deleteClass(cls.id); }} className="text-gray-300 hover:text-red-500 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 font-medium">
                                                <Users size={16} className="text-indigo-400" />
                                                <span>{cls.student_count} élève{cls.student_count > 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {classes.length === 0 && (
                                        <div className="p-8 text-center bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                                            <p className="text-gray-400 font-medium">Aucune classe</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Class Detail */}
                            <div className="lg:col-span-3">
                                {selectedClass ? (
                                    <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-indigo-50 border border-gray-100">
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{selectedClass.academic_year || '2024-2025'}</span>
                                                <h2 className="text-3xl font-black text-gray-900 mt-3">{selectedClass.name}</h2>
                                                <p className="text-gray-500 mt-2">{selectedClass.description || 'Pas de description'}</p>
                                            </div>
                                            <button
                                                onClick={() => setShowAddStudentsModal(true)}
                                                className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                                            >
                                                <UserPlus size={20} />
                                                Ajouter des élèves
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-widest mb-4">Membres de la classe</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {classStudents.map(student => (
                                                    <div key={student.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-indigo-100 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                                                                {student.name[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{student.name}</p>
                                                                <p className="text-xs text-gray-400">{student.email}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeStudentFromClass(student.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {classStudents.length === 0 && (
                                                <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                                    <Users size={48} className="mx-auto text-gray-200 mb-4" />
                                                    <p className="text-gray-400 font-medium">Cette classe est vide</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[32px] p-20 text-center shadow-xl shadow-indigo-50 border border-indigo-50 flex flex-col items-center">
                                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-400 mb-6">
                                            <Users size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-2">Sélectionnez une classe</h3>
                                        <p className="text-gray-500 max-w-sm">Choisissez une classe dans la liste pour voir les élèves et gérer votre groupe.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[32px] p-10 shadow-2xl shadow-indigo-50 border border-gray-100">
                            <div className="flex justify-between items-center mb-12">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">Base de données élèves</h2>
                                    <p className="text-gray-500 mt-2 text-lg">Gérez votre liste globale et importez massivement via Excel</p>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-6 py-3 rounded-2xl hover:bg-indigo-100 transition-all"
                                >
                                    <Download size={20} />
                                    Modèle Excel
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                                <div className="p-8 bg-slate-50 rounded-3xl">
                                    <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-sm">Ajout individuel</h3>
                                    <form onSubmit={handleManualAdd} className="flex gap-3">
                                        <input
                                            type="text"
                                            className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-medium"
                                            placeholder="NOM Prénom"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                        />
                                        <button type="submit" className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-lg">
                                            <Plus size={24} />
                                        </button>
                                    </form>
                                </div>

                                <div className="p-8 bg-indigo-600 rounded-3xl text-white">
                                    <h3 className="font-black mb-6 uppercase tracking-widest text-sm opacity-80">Import massif</h3>
                                    <div
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'bg-white/10 border-white' : 'border-white/30 hover:border-white/60'}`}
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                                        onClick={() => document.getElementById('fileInputFull')?.click()}
                                    >
                                        <UploadCloud size={40} className="mx-auto mb-4" />
                                        <p className="font-bold text-lg">Déposez votre Excel ici</p>
                                        <p className="text-white/60 mt-1">Cliquez pour parcourir vos fichiers</p>
                                        <input
                                            id="fileInputFull"
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            className="hidden"
                                            onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-10">
                                <div className="lg:col-span-4 mb-4">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Liste Complète ({students.length})</h3>
                                </div>
                                {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                                    <div key={student.id} className="p-4 bg-white border-2 border-slate-50 rounded-2xl flex justify-between items-center group hover:border-indigo-100 transition-all shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-gray-400 text-xs">{student.name[0]}</div>
                                            <p className="font-bold text-gray-700 text-sm truncate max-w-[120px]">{student.name}</p>
                                        </div>
                                        <button onClick={() => removeStudent(student.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
                    <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
                        <h2 className="text-3xl font-black text-gray-900 mb-8">Nouvelle Classe</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Nom de la classe</label>
                                <input
                                    type="text"
                                    value={newClass.name}
                                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 focus:bg-white focus:border-indigo-600 transition-all outline-none font-bold"
                                    placeholder="Ex: BTS NDRC 1A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Année Scolaire</label>
                                <input
                                    type="text"
                                    value={newClass.academic_year}
                                    onChange={(e) => setNewClass({ ...newClass, academic_year: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 focus:bg-white focus:border-indigo-600 transition-all outline-none font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 font-bold text-gray-500 hover:bg-slate-50 rounded-2xl transition-all">Annuler</button>
                            <button onClick={createClass} disabled={!newClass.name || loading} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50">Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddStudentsModal && selectedClass && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
                    <div className="bg-white rounded-[32px] shadow-2xl max-w-xl w-full p-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-gray-900">Ajouter à {selectedClass.name}</h2>
                            <button onClick={() => setShowAddStudentsModal(false)} className="text-gray-400 hover:text-gray-900">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 mb-8 custom-scrollbar">
                            {students
                                .filter(s => !classStudents.some(cs => cs.id === s.id))
                                .map(student => (
                                    <label key={student.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedStudentIds.includes(student.id) ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id]);
                                                else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                            }}
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedStudentIds.includes(student.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {selectedStudentIds.includes(student.id) && <X size={12} className="text-white rotate-45" />}
                                        </div>
                                        <span className="font-bold text-gray-700">{student.name}</span>
                                    </label>
                                ))}
                        </div>
                        <button
                            onClick={addStudentsToClass}
                            disabled={selectedStudentIds.length === 0 || loading}
                            className="w-full py-5 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            <Plus size={24} />
                            Enregistrer ({selectedStudentIds.length})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
