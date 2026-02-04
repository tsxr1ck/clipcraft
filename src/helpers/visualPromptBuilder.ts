// helpers/visualPromptBuilder.ts
// Helper function to build visual prompts when you don't have AI enrichment

import type { CharacterRole } from '../types/character';

interface BasicCharacterData {
    name: string;
    role: CharacterRole;
    description: string;
    distinctive_features?: string[];
}

interface SeriesContext {
    visual_style?: string;
    setting?: string;
    full_lore?: string;
}

/**
 * Builds a basic visual prompt from character data
 * Use this as a fallback when AI enrichment isn't available
 */
export function buildBasicVisualPrompt(
    character: BasicCharacterData,
    series: SeriesContext
): string {
    const parts: string[] = [];

    // Character name and role
    parts.push(`Retrato cinematográfico de ${character.name}.`);

    // Role-based description
    const roleDescriptions: Record<CharacterRole, string> = {
        protagonist: 'Personaje principal, heroico y determinado',
        antagonist: 'Antagonista con presencia intimidante',
        aliado: 'Aliado confiable y leal',
        supporting: 'Personaje de apoyo',
        minor: 'Personaje secundario'
    };
    parts.push(roleDescriptions[character.role] + '.');

    // Character description (truncated if too long)
    const cleanDesc = character.description
        .replace(/\n/g, ' ')
        .substring(0, 200);
    parts.push(cleanDesc + '.');

    // Distinctive features if available
    if (character.distinctive_features && character.distinctive_features.length > 0) {
        parts.push(`Rasgos distintivos: ${character.distinctive_features.join(', ')}.`);
    }

    // Series context
    if (series.setting) {
        parts.push(`Ambientación: ${series.setting.substring(0, 150)}.`);
    }

    // Visual style
    const visualStyle = series.visual_style || 'cinematic-realistic';
    parts.push(`Estilo visual: ${visualStyle}.`);

    // Quality descriptors
    parts.push('Iluminación dramática, composición profesional, alta calidad, render detallado.');

    return parts.join(' ');
}

/**
 * Extract distinctive features from description text
 */
export function extractDistinctiveFeatures(description: string): string[] {
    const features: string[] = [];

    // Look for physical descriptions
    const physicalKeywords = [
        'cabello', 'pelo', 'ojos', 'cicatriz', 'tatuaje',
        'altura', 'complexión', 'piel', 'barba', 'implante',
        'scar', 'tattoo', 'hair', 'eyes', 'skin'
    ];

    const sentences = description.split(/[.;]/);

    for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (physicalKeywords.some(keyword => lowerSentence.includes(keyword))) {
            const cleaned = sentence.trim();
            if (cleaned.length > 10 && cleaned.length < 150) {
                features.push(cleaned);
            }
        }
    }

    // Fallback to generic features if none found
    if (features.length === 0) {
        features.push('Expresión característica');
        features.push('Vestimenta distintiva');
        features.push('Postura y presencia únicas');
    }

    return features.slice(0, 5);
}

/**
 * Build visual prompt with AI-like structure but without AI call
 * This is a more sophisticated version for when you want better prompts
 * without calling the AI API
 */
export function buildDetailedVisualPrompt(
    character: BasicCharacterData,
    series: SeriesContext
): string {
    const parts: string[] = [];

    // Header
    parts.push(`Retrato cinematográfico profesional de ${character.name}.`);

    // Role-specific styling
    const roleStyles: Record<CharacterRole, string> = {
        protagonist: 'Iluminación heroica con luz principal fuerte, expresión determinada y confiada',
        antagonist: 'Iluminación dramática con sombras marcadas, presencia intimidante y misteriosa',
        aliado: 'Iluminación cálida y amigable, expresión leal y confiable',
        supporting: 'Iluminación equilibrada, expresión natural y accesible',
        minor: 'Iluminación estándar, presencia casual'
    };
    parts.push(roleStyles[character.role] + '.');

    // Parse age and build from description
    let ageEstimate = 'adulto joven';
    const lowerDesc = character.description.toLowerCase();
    if (lowerDesc.includes('diecinueve') || lowerDesc.includes('adolescent') || lowerDesc.includes('teen')) {
        ageEstimate = 'adolescente tardío';
    } else if (lowerDesc.includes('setenta') || lowerDesc.includes('anciano') || lowerDesc.includes('elderly')) {
        ageEstimate = 'adulto mayor';
    } else if (lowerDesc.includes('cuarenta') || lowerDesc.includes('cincuenta') || lowerDesc.includes('middle')) {
        ageEstimate = 'mediana edad';
    }
    parts.push(`Edad: ${ageEstimate}.`);

    // Physical traits extraction
    const physicalParts: string[] = [];

    if (lowerDesc.includes('cabello') || lowerDesc.includes('pelo')) {
        const hairMatch = lowerDesc.match(/cabello\s+\w+\s+\w+/i) ||
            lowerDesc.match(/pelo\s+\w+\s+\w+/i);
        if (hairMatch) physicalParts.push(hairMatch[0]);
        else physicalParts.push('cabello oscuro estilizado');
    } else {
        physicalParts.push('cabello oscuro natural');
    }

    if (lowerDesc.includes('ojos')) {
        const eyesMatch = lowerDesc.match(/ojos\s+\w+(\s+\w+)?/i);
        if (eyesMatch) physicalParts.push(eyesMatch[0]);
        else physicalParts.push('ojos oscuros expresivos');
    } else {
        physicalParts.push('ojos oscuros intensos');
    }

    if (lowerDesc.includes('piel')) {
        const skinMatch = lowerDesc.match(/piel\s+\w+/i);
        if (skinMatch) physicalParts.push(skinMatch[0]);
        else physicalParts.push('piel morena');
    } else {
        physicalParts.push('piel morena clara');
    }

    if (physicalParts.length > 0) {
        parts.push(physicalParts.join(', ') + '.');
    }

    // Distinctive features
    if (character.distinctive_features && character.distinctive_features.length > 0) {
        parts.push(`Características únicas: ${character.distinctive_features.slice(0, 3).join(', ')}.`);
    }

    // Clothing and style hints from description
    if (lowerDesc.includes('ropa') || lowerDesc.includes('viste') || lowerDesc.includes('clothing')) {
        const clothingMatch = lowerDesc.match(/ropa\s+[\w\s]{5,50}/i) ||
            lowerDesc.match(/viste\s+[\w\s]{5,50}/i);
        if (clothingMatch) {
            parts.push(`Vestimenta: ${clothingMatch[0]}.`);
        }
    } else {
        // Default based on role and setting
        if (series.setting?.toLowerCase().includes('ciberpunk') ||
            series.setting?.toLowerCase().includes('futur')) {
            parts.push('Vestimenta urbana futurista con detalles tecnológicos.');
        } else {
            parts.push('Vestimenta contemporánea apropiada al contexto.');
        }
    }

    // Main description excerpt
    parts.push(`Contexto: ${character.description.substring(0, 150)}...`);

    // Setting context
    if (series.setting) {
        parts.push(`Ambientación: ${series.setting.substring(0, 100)}...`);
    }

    // Visual style
    const visualStyle = series.visual_style || 'cinematic-realistic';
    parts.push(`Estilo visual: ${visualStyle}.`);

    // Technical quality
    parts.push('Composición profesional de retrato, enfoque nítido, profundidad de campo cinematográfica, iluminación dramática de tres puntos, colores ricos y saturados, alta resolución, ultra detallado, fotorrealista.');

    return parts.join(' ');
}

/**
 * Quick prompt builder - minimal but functional
 */
export function buildQuickVisualPrompt(
    name: string,
    description: string,
    visualStyle: string = 'cinematic-realistic'
): string {
    return `Retrato cinematográfico de ${name}. ${description.substring(0, 200)}. Estilo visual: ${visualStyle}. Iluminación dramática, alta calidad, profesional, ultra detallado.`;
}