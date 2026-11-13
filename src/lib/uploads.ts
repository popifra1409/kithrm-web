/**
 * Contrat des pièces jointes du recensement : l'écran promet la limite que la machine
 * *accepte de lire*, pas celle que le validateur Laravel écrit dans sa règle.
 *
 * La nuance a son importance. `photo` et les deux pièces du contrat portent `max:4096`,
 * soit 4 Mio, et `documentRefusal()` applique la même valeur aux pièces des ayants droit
 * et des diplômes — mais `upload_max_filesize = 2M` dans le `php.ini` qui sert l'API. Une
 * pièce de 3 Mio ne rencontre donc jamais ce message de taille : PHP la retire du corps
 * avant le validateur, et le serveur répond alors que « tout fichier au-delà de
 * max_file_uploads » a été refusé — une cause que l'employé ne peut pas vérifier lui-même.
 * Être plus sévère qu'une règle de validation est ici le seul moyen de ne pas l'être plus
 * que la machine.
 *
 * Ces deux valeurs suivent le `php.ini` du serveur : à vérifier (`php -i`) quand la
 * configuration change, sinon l'écran bornerait plus que la machine ou, pire, moins.
 */
import type { Dict } from '../i18n/fr';

/** Une pièce, à la mesure de `upload_max_filesize`. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/**
 * Toutes les pièces d'un même envoi, sous `post_max_size` (8M). C'est le corps complet de
 * la requête que PHP lit ou refuse de lire : l'enveloppe multipart — noms de champs,
 * en-têtes, tout le texte déjà saisi — occupe le reste, d'où 7 Mio plutôt que 8.
 */
export const MAX_TOTAL_UPLOAD_BYTES = 7 * 1024 * 1024;

export const DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

/** Une photo ne se livre pas en PDF. */
export const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png'];

/** Les libellés viennent du dictionnaire : ces fonctions n'en choisissent aucun. */
type UploadCopy = Dict['uploads'];

export function fileSizeLabel(bytes: number, units: UploadCopy['units']): string {
  if (bytes < 1024) return `${bytes} ${units.b}`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ${units.kb}`;
  // En Mio, arrondi au centième et toujours vers le haut : une pièce qui dépasse la limite
  // ne doit jamais s'afficher avec le même chiffre qu'elle, sinon le refus se lit « pèse
  // 2 Mo alors que la limite est 2 Mo » et l'employé n'a plus rien à comprendre.
  const mib = Math.ceil((bytes / (1024 * 1024)) * 100) / 100;
  return `${mib.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')} ${units.mb}`;
}

/** Le poids cumulé des pièces d'un envoi — ce que `post_max_size` regarde. */
export function totalBytes(files: File[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}

/** « pdf, jpg, jpeg, png » se lit « PDF, JPG ou PNG » : JPEG n'est pas un format à part. */
export function formatsLabel(extensions: string[], t: UploadCopy): string {
  const unique = [...new Set(extensions.map((ext) => (ext === 'jpeg' ? 'jpg' : ext)))].map((ext) => ext.toUpperCase());
  const last = unique.pop();
  return unique.length ? `${unique.join(', ')} ${t.or} ${last}` : `${last}`;
}

export function uploadHint(extensions: string[], maxBytes: number, t: UploadCopy): string {
  return t.hint(formatsLabel(extensions, t), fileSizeLabel(maxBytes, t.units));
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/**
 * Ce qu'il faut dire du fichier que l'employé vient de choisir, ou null s'il passera.
 * Refuser à la sélection évite de laisser remplir les cinq étapes pour rien : le
 * serveur refuserait de toute façon, et l'employé n'aurait rien gagné.
 */
export function uploadRefusal(file: File, extensions: string[], maxBytes: number, t: UploadCopy): string | null {
  const formats = formatsLabel(extensions, t);
  const ext = extensionOf(file.name);

  if (!extensions.includes(ext)) {
    return t.refusedFormat(file.name, ext ? t.isFile(ext.toUpperCase()) : t.noExtension, formats);
  }

  if (file.size > maxBytes) {
    return t.refusedSize(file.name, fileSizeLabel(file.size, t.units), fileSizeLabel(maxBytes, t.units));
  }

  return null;
}
