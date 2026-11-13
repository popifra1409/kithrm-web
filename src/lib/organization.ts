import type { BranchType, CensusDraft, OrganizationOptions } from '../api/census';

/**
 * Cascade de l'affectation organisationnelle — logique pure, sans dépendance :
 *   médicale       : Direction → Département → Service → Secteur
 *   administrative : Direction → Sous-direction → Service → Secteur
 * puis Corps de métier → Qualification.
 *
 * Elle reproduit les règles du serveur (App\Support\OrganizationalAssignment) ;
 * le serveur reste de toute façon l'autorité et revérifie la chaîne à l'envoi
 * puis à la validation finale.
 *
 * Sens inverse possible : le service (ou l'unité, dont le service se déduit) est
 * l'ancre, et la chaîne au-dessus se déduit de lui — l'employé n'a pas à connaître
 * sa hiérarchie. Seuls le service et l'unité sont stockés sur la fiche.
 */

/** Types de service rattachables à la branche administrative (identique au serveur). */
export const ADMINISTRATIVE_SERVICE_TYPES = ['administrative', 'support', 'technical'];

/**
 * Branche d'un service d'après son type (règle du serveur). Un type que le serveur
 * ne reconnaît dans aucune des deux branches renvoie null : le proposer aboutirait
 * à un refus.
 */
export function branchOfServiceType(type: string | null | undefined): BranchType | null {
    if (type === 'medical') return 'medical';
    return type && ADMINISTRATIVE_SERVICE_TYPES.includes(type) ? 'administrative' : null;
}

/** Identifiant du service auquel appartient une unité / secteur, ou null si introuvable. */
export function serviceOfSector(options: OrganizationOptions, sectorId: number): number | null {
    return options.sectors.find((sector) => sector.id === sectorId)?.service_id ?? null;
}

/**
 * Toute la chaîne déduite d'un service : la branche, puis le département (médicale)
 * ou la sous-direction (administrative) — jamais les deux — puis la direction de ce
 * parent. Seul le service est réellement stocké sur la fiche : le serveur recalcule
 * la même chaîne et revérifie la cohérence à l'envoi.
 *
 * Un service sans parent rattachable (ou d'un type inconnu) ne laisse déduire ni
 * branche ni niveaux au-dessus : le résultat est null, la saisie reste manuelle.
 */
export function chainOfService(
    options: OrganizationOptions,
    serviceId: number
): {
    branch_type: string;
    direction_id: string;
    department_id: string;
    sub_direction_id: string;
    service_id: string;
} | null {
    const service = options.services.find((s) => s.id === serviceId);
    const branch = service ? branchOfServiceType(service.type) : null;
    if (!service || branch === null) return null;

    const department =
        branch === 'medical' ? options.departments.find((d) => d.id === service.department_id) : undefined;
    const subDirection =
        branch === 'administrative'
            ? options.sub_directions.find((s) => s.id === service.sub_direction_id)
            : undefined;
    const parent = department ?? subDirection;

    return {
        branch_type: branch,
        direction_id: parent?.direction_id != null ? String(parent.direction_id) : '',
        department_id: department ? String(department.id) : '',
        sub_direction_id: subDirection ? String(subDirection.id) : '',
        service_id: String(service.id),
    };
}

type Named = { id: number; name: string };

/**
 * Une déclaration enregistrée avant la nouvelle nomenclature peut porter une
 * catégorie qui n'est plus proposée. Elle reste affichée, marquée « hors
 * nomenclature » : un menu vide alors que le champ est rempli ferait croire à
 * l'employé qu'il n'a rien déclaré, et il choisirait autre chose.
 */
export function withDeclaredPersonnelType(
    listed: { value: string; label: string; description?: string }[],
    declared: string,
    outOfNomenclature: (value: string) => string
) {
    if (!declared || listed.some((t) => t.value === declared)) return listed;

    return [...listed, { value: declared, label: outOfNomenclature(declared) }];
}

/**
 * Garde l'élément déjà choisi dans la liste même s'il n'y est plus rattaché
 * (donnée ancienne, élément désactivé) plutôt que de le faire disparaître sans
 * explication.
 */
function withSelected<T extends Named>(filtered: T[], all: T[], selected: string, label: (name: string) => string): T[] {
    if (!selected) return filtered;

    const id = Number(selected);
    if (filtered.some((x) => x.id === id)) return filtered;

    const found = all.find((x) => x.id === id);
    return found ? [{ ...found, name: label(found.name) }, ...filtered] : filtered;
}

export function computeCascade(
    options: OrganizationOptions,
    org: CensusDraft['organizational'],
    outOfHierarchy: (name: string) => string
) {
    const toId = (v: string) => (v ? Number(v) : null);
    const directionId = toId(org.direction_id);
    const departmentId = toId(org.department_id);
    const subDirectionId = toId(org.sub_direction_id);
    const serviceId = toId(org.service_id);
    const tradeBodyId = toId(org.trade_body_id);

    // Une direction est proposée selon ses enfants réels (le serveur les calcule) :
    // des départements en branche médicale, des sous-directions en branche
    // administrative, les deux quand la branche reste à deviner.
    const directions = options.directions.filter((d) =>
        org.branch_type === 'medical'
            ? d.has_departments
            : org.branch_type === 'administrative'
                ? d.has_sub_directions
                : d.has_departments || d.has_sub_directions
    );

    // Un niveau n'est proposé qu'une fois son parent choisi, SAUF exception voulue :
    // la DIRECTION est facultative et ne conditionne ni le département ni la
    // sous-direction (règle du serveur : App\Support\OrganizationalAssignment).
    // Sans ce garde-fou, « aucun parent » (null) correspondrait à tous les éléments
    // sans parent (null === null) et ferait apparaître à tort des éléments orphelins.
    const departments =
        directionId === null ? options.departments : options.departments.filter((d) => d.direction_id === directionId);
    const subDirections =
        directionId === null ? options.sub_directions : options.sub_directions.filter((s) => s.direction_id === directionId);

    // La branche seule suffit pour proposer des services ; le département (médical) ou
    // la sous-direction (administratif) ne fait que restreindre la liste. Sans branche
    // choisie (« je ne sais pas »), les services des deux branches sont proposés : c'est
    // le service choisi qui remplira la branche.
    let services: OrganizationOptions['services'] = [];
    if (org.branch_type === 'medical') {
        services = options.services.filter(
            (s) => s.type === 'medical' && (departmentId === null || s.department_id === departmentId)
        );
    } else if (org.branch_type === 'administrative') {
        services = options.services.filter(
            (s) =>
                ADMINISTRATIVE_SERVICE_TYPES.includes(s.type) &&
                (subDirectionId === null || s.sub_direction_id === subDirectionId)
        );
    } else {
        services = options.services.filter((s) => branchOfServiceType(s.type) !== null);
    }

    // Une unité se choisit aussi sans connaître son service : la liste est alors
    // complète et le service — donc toute la chaîne — se déduit de l'unité.
    const sectors = serviceId === null ? options.sectors : options.sectors.filter((s) => s.service_id === serviceId);
    const qualifications =
        tradeBodyId === null ? [] : options.qualifications.filter((q) => q.trade_body_id === tradeBodyId);

    return {
        directions: withSelected(directions, options.directions, org.direction_id, outOfHierarchy),
        departments: withSelected(departments, options.departments, org.department_id, outOfHierarchy),
        subDirections: withSelected(subDirections, options.sub_directions, org.sub_direction_id, outOfHierarchy),
        services: withSelected(services, options.services, org.service_id, outOfHierarchy),
        sectors: withSelected(sectors, options.sectors, org.sector_id, outOfHierarchy),
        qualifications: withSelected(qualifications, options.qualifications, org.qualification_id, outOfHierarchy),
    };
}