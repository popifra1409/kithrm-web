/**
 * Contrat des pièces jointes du recensement : ce que l'écran promet est exactement ce
 * que le serveur refuse (CensusController::documentRefusal applique les mêmes valeurs).
 * Annoncer une limite plus large que celle du serveur ferait croire à l'employé que sa
 * pièce est acceptée, puis l'envoi échouerait sans qu'il comprenne pourquoi.
 */

/** Taille maximale d'une pièce, la même que la règle « max:4096 » côté Laravel. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Limite des photos de profil hors recensement (fiches employé, ajout d'un ayant droit). */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

/** Une photo ne se livre pas en PDF. */
export const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} Mo`;
}

/** « pdf, jpg, jpeg, png » se lit « PDF, JPG ou PNG » : JPEG n'est pas un format à part. */
export function formatsLabel(extensions: string[]): string {
  const unique = [...new Set(extensions.map((ext) => (ext === 'jpeg' ? 'jpg' : ext)))].map((ext) => ext.toUpperCase());
  const last = unique.pop();
  return unique.length ? `${unique.join(', ')} ou ${last}` : `${last}`;
}

export function uploadHint(extensions: string[], maxBytes: number): string {
  return `Formats acceptés : ${formatsLabel(extensions)} · ${fileSizeLabel(maxBytes)} maximum`;
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
export function uploadRefusal(file: File, extensions: string[], maxBytes: number): string | null {
  const formats = formatsLabel(extensions);
  const ext = extensionOf(file.name);

  if (!extensions.includes(ext)) {
    return (
      `« ${file.name} » ${ext ? `est un fichier ${ext.toUpperCase()}` : "n'a pas d'extension reconnaissable"} : ` +
      `cette pièce doit être au format ${formats}. Choisis un autre fichier.`    );
  }

  if (file.size > maxBytes) {
    return (
      `« ${file.name} » pèse ${fileSizeLabel(file.size)} : la limite est ${fileSizeLabel(maxBytes)}. ` +
      'Reprends le scan en qualité réduite, en noir et blanc, ou envoie une page à la fois.'
    );
  }

  return null;
}
