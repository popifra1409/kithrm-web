import { useState } from 'react';
import { fileUrl } from '../lib/fileUrl';

interface StructureLogoProps {
    /** Le « logo_url » tel que l'API l'a renvoyé — un chemin, pas une promesse d'existence. */
    logoUrl: string | null | undefined;
    /** Sigle de la structure, dont on garde la première lettre pour le repli. */
    shortName: string | null | undefined;
    /** « sm » pour l'écran d'activation, « md » partout ailleurs. */
    size?: 'sm' | 'md';
}

const BOX = { sm: 'w-14 h-14', md: 'w-16 h-16' } as const;
const LETTER = { sm: 'text-xl', md: 'text-2xl' } as const;

/**
 * Le logo de la structure, ou sa lettre quand le logo n'est pas joignable.
 *
 * La valeur stockée dans « Infos de la structure » survit à la disparition du fichier : le
 * disque de production a déjà été vu sans le dossier que nomme le réglage. Rendre l'image dès
 * qu'un chemin est présent, c'est alors afficher une image cassée ET supprimer le repli, que
 * l'écran savait déjà faire — l'employé ne voit plus ni logo ni lettre, et rien sur la page ne
 * dit pourquoi.
 *
 * Le contrôle se fait donc sur l'élément lui-même : « onError » pour un fichier absent ou un
 * serveur injoignable, « naturalWidth » nul pour un serveur qui répond 200 avec autre chose
 * qu'une image. Aucun sondage préalable, donc aucun clignotement : la lettre tient la place
 * jusqu'à ce que le sort du fichier soit connu.
 */
export default function StructureLogo({ logoUrl, shortName, size = 'md' }: StructureLogoProps) {
    const url = fileUrl(logoUrl);

    // L'adresse jugée morte plutôt qu'un booléen : une adresse nouvelle — Préférences changées,
    // retour en ligne, fichier réenvoyé — se trouve comparée à un souvenir d'une autre, et
    // repart donc jugée sans rien à remettre à zéro.
    const [deadUrl, setDeadUrl] = useState<string | null>(null);

    if (!url || url === deadUrl) {
        return (
            <div className={`${BOX[size]} rounded-2xl bg-primary mx-auto flex items-center justify-center mb-3`}>
                <span className={`text-white font-bold ${LETTER[size]}`}>{(shortName ?? 'H').charAt(0)}</span>
            </div>
        );
    }

    return (
        <img
            src={url}
            alt=""
            className={`${BOX[size]} mx-auto mb-3 object-contain`}
            onError={() => setDeadUrl(url)}
            onLoad={(event) => {
                if (event.currentTarget.naturalWidth === 0) setDeadUrl(url);
            }}
        />
    );
}
