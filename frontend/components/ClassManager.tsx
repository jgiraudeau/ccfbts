import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, UserPlus, X } from 'lucide-react';

const API_URL = "http://localhost:8000"; // process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
                if (selectedClass?.id === classId) {
                    setSelectedClass(null);
                }
            }
        } catch (error) {
            console.error('Error deleting class:', error);
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestion des Classes</h1>
                        <p className="text-gray-600 mt-2">Organisez vos élèves par classe</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        Nouvelle Classe
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Liste des classes */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes Classes ({classes.length})</h2>
                        {classes.map((cls) => (
                            <div
                                key={cls.id}
                                onClick={() => selectClass(cls)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedClass?.id === cls.id
                                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteClass(cls.id);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {cls.description && (
                                    <p className="text-sm text-gray-600 mb-2">{cls.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users size={16} />
                                    <span>{cls.student_count} élève{cls.student_count > 1 ? 's' : ''}</span>
                                </div>
                                {cls.academic_year && (
                                    <p className="text-xs text-gray-400 mt-1">{cls.academic_year}</p>
                                )}
                            </div>
                        ))}

                        {classes.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Aucune classe créée</p>
                                <p className="text-sm text-gray-400 mt-2">Cliquez sur "Nouvelle Classe" pour commencer</p>
                            </div>
                        )}
                    </div>

                    {/* Détails de la classe sélectionnée */}
                    <div className="lg:col-span-2">
                        {selectedClass ? (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h2>
                                        {selectedClass.description && (
                                            <p className="text-gray-600 mt-1">{selectedClass.description}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowAddStudentsModal(true)}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <UserPlus size={18} />
                                        Ajouter des élèves
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-800 mb-3">
                                        Élèves ({classStudents.length})
                                    </h3>
                                    {classStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                <p className="text-sm text-gray-500">{student.email}</p>
                                            </div>
                                            <button
                                                onClick={() => removeStudentFromClass(student.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}

                                    {classStudents.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Aucun élève dans cette classe</p>
                                            <p className="text-sm mt-2">Cliquez sur "Ajouter des élèves" pour commencer</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600 text-lg">Sélectionnez une classe pour voir les détails</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Créer une classe */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nouvelle Classe</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom de la classe *
                                </label>
                                <input
                                    type="text"
                                    value={newClass.name}
                                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: BTS NDRC 1A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newClass.description}
                                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Description optionnelle..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Année scolaire
                                </label>
                                <input
                                    type="text"
                                    value={newClass.academic_year}
                                    onChange={(e) => setNewClass({ ...newClass, academic_year: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: 2024-2025"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={createClass}
                                disabled={!newClass.name || loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ajouter des élèves */}
            {showAddStudentsModal && selectedClass && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Ajouter des élèves à {selectedClass.name}
                        </h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {students
                                .filter(s => !classStudents.find(cs => cs.id === s.id))
                                .map((student) => (
                                    <label
                                        key={student.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                                } else {
                                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{student.name}</p>
                                            <p className="text-sm text-gray-500">{student.email}</p>
                                        </div>
                                    </label>
                                ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddStudentsModal(false);
                                    setSelectedStudentIds([]);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={addStudentsToClass}
                                disabled={selectedStudentIds.length === 0 || loading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Ajout...' : `Ajouter (${selectedStudentIds.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
