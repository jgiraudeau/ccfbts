import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, UserX, TrendingUp, FileText, Award, Shield, Eye, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Teacher {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    class_count: number;
    student_count: number;
}

interface GlobalStats {
    total_students: number;
    total_deadlines: number;
    total_submissions: number;
    pending_reviews: number;
    average_grade: number | null;
    late_submissions: number;
}

export default function AdminPanel() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newTeacher, setNewTeacher] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        fetchTeachers();
        fetchStats();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/teachers`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTeachers(data);
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const createTeacher = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/teachers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newTeacher)
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewTeacher({ name: '', email: '', password: '' });
                fetchTeachers();
                alert('Professeur créé avec succès ! ✅');
            } else {
                const error = await response.json();
                alert(`Erreur: ${error.detail || 'Impossible de créer le professeur'}`);
            }
        } catch (error) {
            console.error('Error creating teacher:', error);
            alert('Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    const toggleTeacherStatus = async (teacherId: number, currentStatus: boolean) => {
        const action = currentStatus ? 'désactiver' : 'activer';
        if (!confirm(`Voulez-vous vraiment ${action} ce professeur ?`)) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/teachers/${teacherId}/activate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });

            if (response.ok) {
                fetchTeachers();
            }
        } catch (error) {
            console.error('Error toggling teacher status:', error);
        }
    };

    const deleteTeacher = async (teacherId: number) => {
        if (!confirm('⚠️ ATTENTION : Supprimer ce professeur supprimera également toutes ses classes et données associées. Continuer ?')) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/teachers/${teacherId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchTeachers();
                fetchStats();
                alert('Professeur supprimé');
            }
        } catch (error) {
            console.error('Error deleting teacher:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const activeTeachers = teachers.filter(t => t.is_active).length;
    const inactiveTeachers = teachers.filter(t => !t.is_active).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="text-indigo-600" size={32} />
                            <h1 className="text-3xl font-bold text-gray-900">Panneau d'Administration</h1>
                        </div>
                        <p className="text-gray-600">Gérez les professeurs et consultez les statistiques globales</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        <UserPlus size={20} />
                        Créer un Professeur
                    </button>
                </div>

                {/* Statistiques globales */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={20} />
                                <h3 className="font-medium opacity-90">Professeurs</h3>
                            </div>
                            <p className="text-3xl font-bold">{teachers.length}</p>
                            <p className="text-sm opacity-75 mt-1">{activeTeachers} actifs</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={20} />
                                <h3 className="font-medium opacity-90">Élèves</h3>
                            </div>
                            <p className="text-3xl font-bold">{stats.total_students}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={20} />
                                <h3 className="font-medium opacity-90">Échéances</h3>
                            </div>
                            <p className="text-3xl font-bold">{stats.total_deadlines}</p>
                        </div>

                        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={20} />
                                <h3 className="font-medium opacity-90">Soumissions</h3>
                            </div>
                            <p className="text-3xl font-bold">{stats.total_submissions}</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye size={20} />
                                <h3 className="font-medium opacity-90">À corriger</h3>
                            </div>
                            <p className="text-3xl font-bold">{stats.pending_reviews}</p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Award size={20} />
                                <h3 className="font-medium opacity-90">Moyenne</h3>
                            </div>
                            <p className="text-3xl font-bold">
                                {stats.average_grade !== null ? `${stats.average_grade.toFixed(1)}` : '-'}
                            </p>
                            <p className="text-sm opacity-75 mt-1">sur 20</p>
                        </div>
                    </div>
                )}

                {/* Liste des professeurs */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users size={24} />
                            Professeurs Inscrits ({teachers.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Professeur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Classes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Élèves
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Inscrit le
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-medium text-gray-900">{teacher.name}</div>
                                                <div className="text-sm text-gray-500">{teacher.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {teacher.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                                                    <UserCheck size={14} />
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                                                    <UserX size={14} />
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-900 font-medium">{teacher.class_count}</span>
                                            <span className="text-gray-500 text-sm ml-1">classe{teacher.class_count > 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-900 font-medium">{teacher.student_count}</span>
                                            <span className="text-gray-500 text-sm ml-1">élève{teacher.student_count > 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(teacher.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleTeacherStatus(teacher.id, teacher.is_active)}
                                                    className={`p-2 rounded-lg transition-colors ${teacher.is_active
                                                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        }`}
                                                    title={teacher.is_active ? 'Désactiver' : 'Activer'}
                                                >
                                                    {teacher.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => deleteTeacher(teacher.id)}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {teachers.length === 0 && (
                            <div className="text-center py-12">
                                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-600">Aucun professeur inscrit</p>
                                <p className="text-sm text-gray-400 mt-2">Créez le premier compte professeur</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Résumé */}
                {teachers.length > 0 && (
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <div className="flex items-center gap-2 text-blue-900">
                            <TrendingUp size={20} />
                            <p className="font-medium">
                                {activeTeachers} professeur{activeTeachers > 1 ? 's' : ''} actif{activeTeachers > 1 ? 's' : ''}
                                {inactiveTeachers > 0 && ` • ${inactiveTeachers} inactif${inactiveTeachers > 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Créer un professeur */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Créer un Professeur</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={newTeacher.name}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: Jean Dupont"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={newTeacher.email}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="professeur@exemple.fr"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mot de passe *
                                </label>
                                <input
                                    type="password"
                                    value={newTeacher.password}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Mot de passe sécurisé"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Le professeur pourra le changer après sa première connexion
                                </p>
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
                                onClick={createTeacher}
                                disabled={!newTeacher.name || !newTeacher.email || !newTeacher.password || loading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
