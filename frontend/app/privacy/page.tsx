"use client";

import React from "react";
import { Shield, Lock, Eye, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-800 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                        <ArrowLeft size={20} />
                        Retour
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="text-indigo-600" size={24} />
                        <span className="font-extrabold text-xl tracking-tight text-gray-900 uppercase">RGPD</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 mt-12 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Politique de Confidentialité</h1>
                <p className="text-gray-500 mb-8 font-medium">Dernière mise à jour : 31 Mars 2026</p>

                <div className="prose prose-indigo prose-lg max-w-none space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Eye size={24} />
                            <h2 className="text-2xl font-bold m-0">1. Quelles données recueillons-nous ?</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed m-0">
                            Dans le cadre du suivi pédagogique pour le BTS NDRC, nous collectons les informations suivantes :
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 font-medium">
                            <li>Identité : Prénom, Nom, Nom de la classe.</li>
                            <li>Évaluations : Notes, commentaires pédagogiques et grilles de compétences.</li>
                            <li>Travaux : Documents déposés (fiches E4, comptes-rendus E6).</li>
                            <li>Authentification : Identifiant (prenom-nom) et mot de passe hashé.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Shield size={24} />
                            <h2 className="text-2xl font-bold m-0">2. Finalité du traitement</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed m-0">
                            Ces données sont exclusivement utilisées pour :
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 font-medium">
                            <li>Assurer le suivi individuel de votre progression (CCF).</li>
                            <li>Permettre à votre formateur NDRC de vous évaluer.</li>
                            <li>Centraliser vos documents pour les épreuves officielles.</li>
                        </ul>
                        <p className="text-gray-600 italic">Ces données ne sont jamais vendues ou communiquées à des tiers à des fins commerciales.</p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Lock size={24} />
                            <h2 className="text-2xl font-bold m-0">3. Sécurité de vos données</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed m-0">
                            La confidentialité de vos données est notre priorité :
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 font-medium">
                            <li>Les mots de passe sont hashés avec l'algorithme bcrypt.</li>
                            <li>L'accès au portail élève est strictement restreint à l'utilisateur concerné.</li>
                            <li>L'enseignant n'a accès qu'à sa propre liste d'élèves.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Trash2 size={24} />
                            <h2 className="text-2xl font-bold m-0">4. Vos droits (RGPD)</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed m-0">
                            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2 font-medium">
                            <li><strong>Droit d'accès et de rectification</strong> : Vous pouvez consulter vos notes à tout moment.</li>
                            <li><strong>Droit à l'effacement</strong> : Vous avez la possibilité de supprimer votre compte et l'intégralité de vos documents directement depuis votre portail élève.</li>
                            <li><strong>Droit à la portabilité</strong> : Vous pouvez prochainement télécharger une archive de vos données.</li>
                        </ul>
                    </section>

                    <section className="space-y-4 pt-6 border-t border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 m-0">Contact</h2>
                        <p className="text-gray-600 m-0">
                            Pour toute question relative à vos données, contactez votre formateur ou l'administration de votre établissement.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
