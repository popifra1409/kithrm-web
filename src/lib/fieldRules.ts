/**
 * Le contrôle de saisie du recensement, dans le navigateur.
 *
 * Ces règles sont le miroir de `$rules` dans
 * kisingrh/app/Http/Controllers/Api/CensusController.php (submit). Le serveur garde le
 * dernier mot — un client ne fait pas foi — mais une exigence découverte à la cinquième
 * étape n'est plus une règle, c'est une surprise : « 01 » est un nombre pour l'employé,
 * c'est un refus `integer` pour Laravel (`filter_var` rejette les zéros de tête), et
 * l'écran n'avait nulle part où le lui dire.
 *
 * Une règle plus sévère ici que là-bas serait le pire des contrats : l'employé serait
 * bloqué par son propre formulaire. Les bornes ci-dessous reprennent donc exactement
 * celles du serveur (nullable = un champ vide n'est jamais une erreur).
 *
 * Les dates en sont absentes : `components/DateInput.tsx` contrôle déjà le masque
 * JJ-MM-AAAA à la frappe et ne transmet qu'une date réelle ou ''.
 */
import type { Dict } from '../i18n/fr';

export type CheckCopy = Dict['census']['check'];

export interface Spec {
  /**
   * count = `integer` + `min:0` · year = `integer` + bornes · email = `email` ·
   * text = `string` + `max:N`
   */
  kind: 'count' | 'year' | 'email' | 'text';
  /** Borne basse d'un nombre ou d'une année. */
  min?: number;
  /** Longueur maximale, en caractères, comme `max:255` côté Laravel. */
  max?: number;
  /** `required_with` : la ligne est déclarée, ce champ doit l'être aussi. */
  required?: boolean;
}

export const TEXT_MAX = 255;

/** Champs de la fiche (branche `personal` de la requête). */
export const PERSONAL_SPECS: Record<string, Spec> = {
  matricule_fonction_publique: { kind: 'text', max: TEXT_MAX },
  first_name: { kind: 'text', max: TEXT_MAX },
  last_name: { kind: 'text', max: TEXT_MAX },
  id_card_number: { kind: 'text', max: TEXT_MAX },
  children_under_6: { kind: 'count', min: 0 },
  total_children: { kind: 'count', min: 0 },
  phone: { kind: 'text', max: TEXT_MAX },
  email: { kind: 'email', max: TEXT_MAX },
  address: { kind: 'text', max: TEXT_MAX },
  city: { kind: 'text', max: TEXT_MAX },
  bank_name: { kind: 'text', max: TEXT_MAX },
  bank_account_number: { kind: 'text', max: TEXT_MAX },
  cnps_number: { kind: 'text', max: TEXT_MAX },
};

export const CONTRACT_SPECS: Record<string, Spec> = {
  contract_number: { kind: 'text', max: TEXT_MAX },
};

/** Champs saisissables d'un ayant droit (`dependents.*`). */
export const DEPENDENT_SPECS: Record<string, Spec> = {
  last_name: { kind: 'text', max: TEXT_MAX, required: true },
  first_name: { kind: 'text', max: TEXT_MAX },
};

/** Champs saisissables d'un diplôme (`diplomas.*`). */
export const DIPLOMA_SPECS: Record<string, Spec> = {
  title: { kind: 'text', max: TEXT_MAX, required: true },
  institution: { kind: 'text', max: TEXT_MAX, required: true },
  year_obtained: { kind: 'year', min: 1950, required: true },
};

/**
 * « 01 » voulu « 1 » : la correction est faite à la sortie du champ, pour que
 * l'employé voie lui-même la valeur partir telle que le serveur va la lire. Ce qui
 * n'est pas un nombre du tout reste inchangé — c'est au message de l'expliquer.
 */
export function normalizeCount(raw: string): string {
  if (/^0+\d+$/.test(raw)) return raw.replace(/^0+/, '');
  if (/^0+$/.test(raw)) return '0';
  return raw;
}

/**
 * Un entier tel que le lit `filter_var(..., FILTER_VALIDATE_INT)`, la fonction derrière la
 * règle `integer` de Laravel : signe facultatif, puis « 0 » ou un chiffre non nul suivi de
 * chiffres. « 01 », « 00 », « 5.0 », « 1e3 » sont donc refusés ici aussi, alors que « +5 »
 * et « -0 » passent — vérifié contre `Illuminate\Validation\Factory` plutôt que contre
 * l'intuition, parce qu'une règle plus sévère que le serveur bloquerait un agent pour rien.
 */
const INT_LITERAL = /^[+-]?(0|[1-9]\d*)$/;

/**
 * Ce qu'il faut dire de la valeur d'un champ, ou null si le serveur l'accepterait.
 * Un champ vide n'est une erreur que si la règle est `required_with`.
 */
export function problem(value: string, spec: Spec, t: CheckCopy): string | null {
  const v = value.trim();

  // «   » compte comme vide : la requête HTTP passe par ConvertEmptyStringsToNull, le
  // serveur ne reçoit donc jamais une chaîne de blancs, et `nullable` l'accepte.
  if (v === '') return spec.required ? t.required : null;

  if (spec.kind === 'count') {
    const floor = spec.min ?? 0;

    // « 01 » est corrigé à la sortie du champ (leaveCount), mais un brouillon relevé après
    // une fermeture d'onglet peut porter la valeur telle quelle : sans ce contrôle, il
    // partirait et le serveur le refuserait — le refus muet que l'employé subissait.
    if (!INT_LITERAL.test(v)) return t.wholeNumber;

    return Number(v) < floor ? t.atLeast(floor) : null;
  }

  if (spec.kind === 'year') {
    const ceiling = new Date().getFullYear();
    const floor = spec.min ?? 1900;
    if (!INT_LITERAL.test(v)) return t.year(floor, ceiling);

    const n = Number(v);
    return n < floor || n > ceiling ? t.year(floor, ceiling) : null;
  }

  if (spec.kind === 'email') {
    // Le contrôleur du serveur utilise le validateur d'adresses de Laravel, qui accepte
    // « a@b » sans point. Reprendre une adresse que le serveur lirait comme valide
    // laisserait l'employé devant un formulaire qui le contredit : seuls les cas
    // certainement refusés sont signalés ici — pas de « @ », plusieurs « @ », un espace,
    // une partie vide de l'un ou l'autre côté.
    return /^[^@\s]+@[^@\s]+$/.test(v) ? null : t.email;
  }

  const length = [...value].length;
  return length > (spec.max ?? TEXT_MAX) ? t.tooLong(length, spec.max ?? TEXT_MAX) : null;
}

/** Le message d'un champ d'après la table qui le décrit, ou null s'il est libre. */
export function specProblem(
  specs: Record<string, Spec>,
  field: string,
  value: string,
  t: CheckCopy,
): string | null {
  const spec = specs[field];
  return spec ? problem(value ?? '', spec, t) : null;
}

/** Une ligne en défaut : la clé du champ et la phrase à afficher. */
export interface Problem {
  key: string;
  message: string;
}

/**
 * Défauts d'un objet plat au regard d'une table de règles. L'objet est reçu tel quel
 * (une branche du brouillon) : seules les clés de la table sont lues, les autres — les
 * pièces jointes d'une ligne, par exemple — sont ignorées.
 */
export function problemsOf(specs: Record<string, Spec>, values: object, t: CheckCopy): Problem[] {
  const source = values as Record<string, unknown>;

  return Object.keys(specs)
    .map((key) => ({ key, message: specProblem(specs, key, typeof source[key] === 'string' ? (source[key] as string) : '', t) }))
    .filter((p): p is Problem => p.message !== null);
}
