"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-8 font-medium">
                    <ArrowLeft size={18} />
                    Retour à la connexion
                </Link>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-indigo-100 p-3 rounded-xl">
                            <Shield size={24} className="text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Politique de confidentialité</h1>
                    </div>

                    <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : mars 2026</p>

                    <div className="space-y-8 text-gray-700 leading-relaxed">
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
                            <p>
                                Le responsable du traitement des données est l&apos;établissement d&apos;enseignement
                                dans lequel la plateforme CCF BTS NDRC est utilisée, représenté par son chef
                                d&apos;établissement. Le professeur référent assure la gestion opérationnelle de la
                                plateforme.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données collectées</h2>
                            <p className="mb-2">Dans le cadre de son fonctionnement, la plateforme collecte et traite les données suivantes :</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Identité</strong> : nom, prénom, identifiant de connexion</li>
                                <li><strong>Données scolaires</strong> : notes CCF (E4, E6), évaluations de compétences, commentaires pédagogiques</li>
                                <li><strong>Documents de travail</strong> : fiches descriptives d&apos;activité, comptes-rendus, dossiers de stage</li>
                                <li><strong>Données de stage</strong> : entreprise d&apos;accueil, dates, tuteur</li>
                                <li><strong>Données techniques</strong> : date de connexion, consentement RGPD</li>
                            </ul>
                            <p className="mt-2 text-sm text-gray-500">
                                Aucune donnée bancaire, de santé ou d&apos;opinion n&apos;est collectée.
                                L&apos;email est généré automatiquement et n&apos;est pas utilisé pour la communication.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Finalité du traitement</h2>
                            <p>Les données sont traitées exclusivement pour :</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Le suivi pédagogique des étudiants de BTS NDRC</li>
                                <li>L&apos;évaluation en Contrôle en Cours de Formation (CCF) des épreuves E4 et E6</li>
                                <li>Le dépôt et la correction de documents pédagogiques</li>
                                <li>La génération de grilles d&apos;évaluation conformes à la circulaire nationale</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Base légale</h2>
                            <p>
                                Le traitement est fondé sur l&apos;<strong>exécution d&apos;une mission de service public</strong> (article 6.1.e du RGPD),
                                à savoir la formation et l&apos;évaluation des étudiants dans le cadre du BTS NDRC.
                                Le consentement est recueilli à titre complémentaire lors de la première connexion de l&apos;élève.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Durée de conservation</h2>
                            <p>
                                Les données sont conservées pendant la durée de la formation, puis supprimées
                                au plus tard <strong>un an après la fin de l&apos;année scolaire</strong> en cours.
                                Les professeurs peuvent supprimer les données de leurs élèves à tout moment
                                via le panneau de gestion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Hébergement et sous-traitants</h2>
                            <p className="mb-2">Les données sont hébergées par les services suivants :</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Railway</strong> (base de données PostgreSQL) — États-Unis, avec clauses contractuelles types UE-USA</li>
                                <li><strong>Vercel</strong> (interface web) — États-Unis, avec clauses contractuelles types UE-USA</li>
                                <li><strong>Google Cloud</strong> (API Gemini, génération de scénarios) — traitement ponctuel, pas de stockage</li>
                            </ul>
                            <p className="mt-2 text-sm text-gray-500">
                                Une migration vers un hébergeur français/européen est envisagée pour renforcer la conformité.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Sécurité des données</h2>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Les mots de passe sont chiffrés avec l&apos;algorithme <strong>bcrypt</strong></li>
                                <li>Les communications sont chiffrées en <strong>HTTPS/TLS</strong></li>
                                <li>L&apos;accès aux données est protégé par authentification JWT</li>
                                <li>Chaque professeur n&apos;accède qu&apos;aux données de ses propres élèves</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Droits des utilisateurs</h2>
                            <p className="mb-2">
                                Conformément au RGPD (articles 15 à 21), vous disposez des droits suivants :
                            </p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Droit d&apos;accès</strong> : consulter vos données personnelles</li>
                                <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
                                <li><strong>Droit à l&apos;effacement</strong> : supprimer votre compte et toutes vos données (disponible dans votre espace élève)</li>
                                <li><strong>Droit à la portabilité</strong> : obtenir vos données dans un format lisible</li>
                                <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos données</li>
                            </ul>
                            <p className="mt-3">
                                Pour exercer ces droits, contactez votre professeur référent ou le Délégué à la
                                Protection des Données (DPO) de votre établissement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Réclamation</h2>
                            <p>
                                Si vous estimez que le traitement de vos données ne respecte pas la réglementation,
                                vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission
                                Nationale de l&apos;Informatique et des Libertés) sur{" "}
                                <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                    www.cnil.fr
                                </a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
