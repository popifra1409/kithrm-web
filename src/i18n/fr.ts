/**
 * Dictionnaire français : c'est lui qui définit la forme (`Dict`) que `en.ts` doit
 * respecter, donc un texte anglais oublié fait échouer `tsc` au lieu de silencieusement
 * retomber sur du français. Les valeurs qui portent un nombre ou un nom sont des
 * fonctions : l'interpolation reste visible à l'appel.
 */
export const fr = {
    switcher: {
        fieldset: 'Langue de l’interface',
        fr: 'Français',
        en: 'English',
    },
    doc: {
        title: 'Espace personnel',
    },
    layout: {
        brand: 'KitHRM',
        expandMenu: 'Déplier le menu',
        collapseMenu: 'Replier le menu',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu',
        logout: 'Se déconnecter',
        nav: {
            home: 'Accueil',
            profile: 'Mon Profil',
            leaves: 'Mes Congés',
            dependents: 'Ayants Droit',
            diplomas: 'Diplômes',
            census: 'Recensement',
        },
    },
    login: {
        title: 'Connexion',
        subtitle: 'Accédez à votre espace employé',
        matriculeLabel: 'Matricule',
        matriculePlaceholder: 'Ex: 98240812A',
        passwordLabel: 'Mot de passe',
        missingFields: 'Veuillez renseigner votre matricule et votre mot de passe.',
        submitting: 'Connexion...',
        submit: 'Se connecter',
        lockedRetry: (minutes: number) => `Nouvelle tentative possible dans ${minutes} minute(s).`,
        attemptsWithoutHelp: (used: number, max: number, lockMinutes: number) =>
            `Échec ${used} sur ${max}. Au ${max}e échec, le compte sera mis en pause pendant ${lockMinutes} minutes.`,
        attemptsWithHelp: (used: number, max: number, helpAfter: number, lockMinutes: number) =>
            `Échec ${used} sur ${max}. Une aide s'affichera après ${helpAfter} tentatives ; au ${max}e échec, le compte sera mis en pause pendant ${lockMinutes} minutes.`,
        showHelp: 'Besoin d’aide ? Afficher les démarches',
        firstConnectionLink: 'Première connexion ? Activer mon compte',
        helpTitle: 'Vous n’arrivez pas à vous connecter ?',
        helpNeedsActivation:
            'Votre compte n’a jamais été ouvert : la démarche est l’activation, avec le mot de passe temporaire remis par le Service RH.',
        helpLocked:
            'Votre compte est en pause après plusieurs échecs. Vous pouvez quand même lancer dès maintenant l’une de ces démarches :',
        helpChoices:
            'Trois options s’offrent à vous. Un agent du Service RH vérifie votre identité sur place, puis traite votre demande :',
        activateLink: 'Activer mon compte',
        activateTag: 'première connexion',
        forgotLink: 'Mot de passe oublié',
        forgotTag: 'réinitialisation',
        keepTrying: (attemptsLeft: number) => `Continuer mes tentatives (${attemptsLeft} restante(s))`,
    },
    home: {
        greeting: 'Bonjour,',
        notFilled: 'Non renseigné',
        matricule: 'Matricule',
        jobTitle: 'Poste',
        department: 'Département',
        quickAccessTitle: 'Accès rapide',
        quickLinks: {
            career: 'Ma carrière',
            dependents: 'Ayants droit',
            diplomas: 'Diplômes',
            leaves: 'Congés',
            census: 'Recensement',
        },
        unavailableTooltip: 'Pas encore disponible sur le web',
        comingSoon: 'Bientôt',
        absences: 'Absences',
        portalTitle: 'Votre espace RH',
        portalSubtitle: 'Un portail complet, sécurisé et disponible 24h/24',
        services: {
            payslips: { label: 'Fiches de paie', desc: 'Consulte et télécharge tes bulletins de salaire' },
            leaves: { label: 'Congés & Absences', desc: 'Demande et suis tes congés en ligne' },
            file: { label: 'Dossier administratif', desc: 'Accède à ton dossier personnel complet' },
            training: { label: 'Formation continue', desc: 'Inscris-toi aux formations disponibles' },
            reviews: { label: 'Évaluations', desc: 'Consulte tes évaluations de performance' },
            news: { label: 'Informations RH', desc: 'Reste informé des actualités du personnel' },
        },
        publicationsTitle: '📚 Publications & Documents officiels',
        publicationsSubtitle:
            'Règlements, conventions, circulaires et informations importantes pour le personnel',
        publications: {
            rules: { label: 'Règlement intérieur', desc: 'Code de conduite, discipline et règles de fonctionnement' },
            convention: { label: 'Convention collective', desc: 'Droits, obligations et conditions de travail du personnel' },
            reforms: { label: 'Nouvelles réformes', desc: 'Dernières réformes et mises à jour réglementaires' },
            retirees: { label: 'Personnel en retraite', desc: 'Informations et droits pour le personnel retraité' },
            circulars: { label: 'Circulaires & Notes', desc: 'Communications officielles de la Direction Générale' },
            courses: { label: 'Formations & Stages', desc: 'Opportunités de développement professionnel' },
        },
    },
    connection: {
        serverUnreachable: 'Le serveur de la RH est injoignable',
        serverUnreachableDetail:
            'Ton réseau fonctionne, mais le serveur ne répond pas. Réessaie dans un instant.',
        internetLost: 'Connexion internet perdue',
        internetLostDetail: 'Vérifie le Wi-Fi ou les données mobiles de l’appareil.',
        draftKept: 'Tes informations déjà saisies restent enregistrées sur cet appareil.',
        retry: 'Réessayer',
        retrying: 'Test…',
    },
    notFound: {
        title: 'Adresse introuvable',
        body: 'Cette page n’existe pas dans ton espace employé. Le lien est peut-être incomplet ou ancien.',
        backHome: 'Retour à l’accueil',
        signIn: 'Se connecter',
        hrHint: 'En cas de doute, préviens le service des Ressources Humaines.',
    },
};

export type Dict = typeof fr;
