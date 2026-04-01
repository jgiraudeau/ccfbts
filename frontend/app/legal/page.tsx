"use client";

import React from "react";
import { ArrowLeft, Scale, LayoutIcon, Globe, Mail } from "lucide-react";
import Link from "next/link";

export default function LegalNotice() {
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
                        <Scale className="text-indigo-600" size={24} />
                        <span className="font-extrabold text-xl tracking-tight text-gray-900 uppercase">LÉGAL</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 mt-12 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Mentions Légales</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <section className="space-y-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Scale size={24} />
                            <h2 className="text-xl font-bold m-0">1. Éditeur du site</h2>
                        </div>
                        <div className="text-gray-600 space-y-2 leading-relaxed">
                            <p className="font-bold">Responsable : Assistant Pédagogique BTS NDRC</p>
                            <p>Plateforme d'accompagnement numérique BTS NDRC</p>
                            <p>Contact : Adressez-vous à votre formateur référent</p>
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Mail size={16} />
                                <span className="italic">support-ndrc@votre-ecole.fr</span>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                        <div className="flex items-center gap-3 text-purple-600">
                            <Globe size={24} />
                            <h2 className="text-xl font-bold m-0">2. Hébergement</h2>
                        </div>
                        <div className="text-gray-600 space-y-2 leading-relaxed font-medium">
                            <p><strong>Serveur Frontend</strong> : Vercel Inc.</p>
                            <p><strong>Serveur Backend</strong> : Railway.app</p>
                            <p><strong>Stockage</strong> : Railway (PostgreSQL / SQLite)</p>
                        </div>
                    </section>
                </div>

                <div className="space-y-10 prose prose-indigo max-w-none">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-800">
                            <LayoutIcon size={24} className="text-indigo-400" />
                            <h2 className="text-2xl font-bold m-0">3. Propriété Intellectuelle</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed m-0 font-medium">
                            La structure générale du site, ainsi que les textes, graphiques, images, sons et vidéos la composant, sont la propriété de l'éditeur ou de ses partenaires. Toute représentation et/ou reproduction et/ou exploitation partielle ou totale des contenus et services proposés par le site, par quelque procédé que ce soit, sans l'autorisation préalable et par écrit de l'éditeur est strictement interdite.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold m-0">4. Limitation de responsabilité</h2>
                        <p className="text-gray-600 leading-relaxed m-0 font-medium">
                            L'éditeur s'efforce d'assurer au mieux de ses possibilités, l'exactitude et la mise à jour des informations diffusées sur ce site. L'éditeur ne saurait être tenu pour responsable des erreurs, omissions ou des résultats qui pourraient être obtenus par un mauvais usage de celles-ci.
                        </p>
                    </section>

                    <section className="space-y-4 pt-10 border-t border-gray-100">
                        <p className="text-gray-500 text-sm italic m-0">
                            Ce site est un outil pédagogique destiné aux étudiants et formateurs du BTS NDRC. L'utilisation de cet outil implique l'acceptation de la charte informatique de votre établissement.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
