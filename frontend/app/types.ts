export type Rating = 'TI' | 'I' | 'S' | 'TS';
export type ExamType = 'E6' | 'E4';

export const RATINGS = [
    { id: 'TI', value: 5, label: 'TI', full: 'Très Insuffisant', color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100', activeColor: 'bg-red-500 text-white border-red-600 shadow-red-200' },
    { id: 'I', value: 10, label: 'I', full: 'Insuffisant', color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100', activeColor: 'bg-orange-500 text-white border-orange-600 shadow-orange-200' },
    { id: 'S', value: 15, label: 'S', full: 'Satisfaisant', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100', activeColor: 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200' },
    { id: 'TS', value: 20, label: 'TS', full: 'Très Satisfaisant', color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100', activeColor: 'bg-blue-600 text-white border-blue-700 shadow-blue-200' }
];

export const calculateGrade = (ratings: Record<string, string>) => {
    if (!ratings) return null;
    const values = Object.values(ratings).map(rId => {
        const rating = RATINGS.find(r => r.id === rId);
        return rating ? rating.value : 0;
    });
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
};

export interface Skill {
    id: number | string;
    name: string;
    criteria: string[];
}

export interface Domain {
    id: string;
    exam?: ExamType; // E6 or E4
    title: string;
    subtitle: string;
    color: string;
    gradient: string;
    icon: any;
    skills: Skill[];
}

export interface Evaluation {
    id: number;
    studentId: number;
    domainId: string;
    date: string;
    ratings: Record<string, Rating>;
    comment: string;
}

export interface FinalEvaluation {
    id: number;
    studentId: number;
    date: string;
    ratings: Record<string, Rating>;
    globalComment: string;
    examType: ExamType; // E4 or E6
}
