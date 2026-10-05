import type { CensusDraft, OrganizationOptions } from '../api/census';

/**
 * Cascade de l'affectation organisationnelle — logique pure, sans dépendance :
 *   médicale       : Direction → Département → Service → Secteur
 *   administrative : Direction → Sous-direction → Service → Secteur
 * puis Corps de métier → Qualification.
 *
 * Elle reproduit les règles du serveur (App\Support\OrganizationalAssignment) ;
 * le serveur reste de toute façon l'autorité et revérifie la chaîne à l'envoi
 * puis à la validation finale.
 */

/** Types de service rattachables à la branche administrative (identique au serveur). */
export const ADMINISTRATIVE_SERVICE_TYPES = ['administrative', 'support', 'technical'];

type Named = { id: number; name: string };

/**
 * Garde l'élément déjà choisi dans la liste même s'il n'y est plus rattaché
 * (donnée ancienne, élément désactivé) plutôt que de le faire disparaître sans
 * explication.
 */
function withSelected<T extends Named>(filtered: T[], all: T[], selected: string): T[] {
    if (!selected) return filtered;

    const id = Number(selected);
    if (filtered.some((x) => x.id === id)) return filtered;

    const found = all.find((x) => x.id === id);
    return found ? [{ ...found, name: `${found.name} (hors hiérarchie)` }, ...filtered] : filtered;
}

export function computeCascade(options: OrganizationOptions, org: CensusDraft['organizational']) {
    const toId = (v: string) => (v ? Number(v) : null);
    const directionId = toId(org.direction_id);
    const departmentId = toId(org.department_id);
    const subDirectionId = toId(org.sub_direction_id);
    const serviceId = toId(org.service_id);
    const tradeBodyId = toId(org.trade_body_id);

    // Une direction est proposée selon ses enfants réels (le serveur les calcule) :
    // des départements en branche médicale, des sous-directions en branche administrative.
    const directions = options.directions.filter((d) =>
        org.branch_type === 'medical' ? d.has_departments : org.branch_type === 'administrative' ? d.has_sub_directions : false
    );

    // Un niveau n'est proposé qu'une fois son parent choisi. Sans ce garde-fou,
    // « aucun parent » (null) correspondrait à tous les éléments sans parent
    // (null === null) et ferait apparaître à tort des éléments orphelins.
    //
    // Exception voulue : le DÉPARTEMENT. La direction le filtre quand elle est choisie ;
    // sinon tous les départements sont proposés, pour que ceux qui n'ont pas (encore)
    // de direction restent accessibles. Choisir un département remplit sa direction.
    const departments =
        directionId === null ? options.departments : options.departments.filter((d) => d.direction_id === directionId);
    const subDirections = directionId === null ? [] : options.sub_directions.filter((s) => s.direction_id === directionId);

    let services: OrganizationOptions['services'] = [];
    if (org.branch_type === 'medical' && departmentId !== null) {
        services = options.services.filter((s) => s.type === 'medical' && s.department_id === departmentId);
    } else if (org.branch_type === 'administrative' && subDirectionId !== null) {
        services = options.services.filter(
            (s) => ADMINISTRATIVE_SERVICE_TYPES.includes(s.type) && s.sub_direction_id === subDirectionId
        );
    }

    const sectors = serviceId === null ? [] : options.sectors.filter((s) => s.service_id === serviceId);
    const qualifications =
        tradeBodyId === null ? [] : options.qualifications.filter((q) => q.trade_body_id === tradeBodyId);

    return {
        directions: withSelected(directions, options.directions, org.direction_id),
        departments: withSelected(departments, options.departments, org.department_id),
        subDirections: withSelected(subDirections, options.sub_directions, org.sub_direction_id),
        services: withSelected(services, options.services, org.service_id),
        sectors: withSelected(sectors, options.sectors, org.sector_id),
        qualifications: withSelected(qualifications, options.qualifications, org.qualification_id),
    };
}