import React from 'react';
import { LayoutDashboard, Users, Calendar, GraduationCap, BookOpen, Sparkles } from 'lucide-react';

export default function WelcomeDashboard() {
    const features = [
        {
            icon: LayoutDashboard,
            title: 'Tableau de Bord',
            description: 'Consultez un aperçu des soumissions de vos élèves et suivez leur progression en temps réel.',
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700'
        },
        {
            icon: Users,
            title: 'Mes Classes',
            description: 'Créez et organisez vos classes, ajoutez des élèves et gérez vos groupes facilement.',
            color: 'from-purple-500 to-pink-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700'
        },
        {
            icon: Calendar,
            title: 'Planning Annuel',
            description: 'Définissez les échéances pour vos évaluations et suivez le calendrier pédagogique.',
            color: 'from-emerald-500 to-teal-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-700'
        }
    ];

    const evaluationFeatures = [
        {
            icon: GraduationCap,
            title: 'Évaluations E4/E6',
            description: 'Accédez aux grilles d\'évaluation officielles et notez vos étudiants selon le référentiel BTS NDRC.',
            color: 'from-amber-500 to-orange-600'
        },
        {
            icon: Sparkles,
            title: 'Générateur de Scénarios',
            description: 'Créez automatiquement des scénarios de mise en situation professionnelle pour les épreuves E4.',
            color: 'from-violet-500 to-purple-600'
        },
        {
            icon: BookOpen,
            title: 'Documents Déposés',
            description: 'Consultez et corrigez les documents déposés par vos élèves (fiches E4, dossiers E6, etc.).',
            color: 'from-cyan-500 to-blue-600'
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg">
                        <BookOpen size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            Bienvenue sur <span className="text-indigo-600">Assistant CCF</span>
                        </h1>
                        <p className="text-gray-600 mt-2 text-lg">
                            Votre outil complet pour gérer les évaluations et le suivi pédagogique en BTS NDRC
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Features Grid */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
                    Système de Suivi des Élèves
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                            >
                                <div className={`p-4 ${feature.bgColor} rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon size={32} className={feature.textColor} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Evaluation Features */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
                    CCF & Évaluations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {evaluationFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <Icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Start Guide */}
            <div className="mt-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Pour commencer</h2>
                <div className="space-y-3 text-gray-700">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</div>
                        <div>
                            <p className="font-semibold">Créez vos classes</p>
                            <p className="text-sm text-gray-600">Utilisez le menu "Mes Classes" pour organiser vos groupes d'élèves</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</div>
                        <div>
                            <p className="font-semibold">Définissez les échéances</p>
                            <p className="text-sm text-gray-600">Dans "Planning Annuel", planifiez les dates de rendu pour vos évaluations</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</div>
                        <div>
                            <p className="font-semibold">Suivez et évaluez</p>
                            <p className="text-sm text-gray-600">Consultez le tableau de bord pour voir les soumissions et commencez les évaluations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
