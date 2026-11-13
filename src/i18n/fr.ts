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
            preferences: 'Préférences',
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
            'Votre réseau fonctionne, mais le serveur n’a pas répondu. Réessayez dans un instant.',
        originBlocked: 'Le serveur répond, mais votre navigateur refuse ses réponses',
        originBlockedDetail:
            'L’adresse de cette page ne figure pas dans la liste des adresses autorisées par le serveur de la RH. Ce n’est pas votre connexion : prévenez le Service RH.',
        mixedContent: 'Cette page est en connexion sécurisée, le serveur de la RH ne l’est pas',
        mixedContentDetail:
            'Un navigateur ne peut pas appeler une adresse « http » depuis une page sécurisée. Dans la structure, ouvrez directement l’adresse du serveur local, par exemple http://116.72.30.12:8084.',
        serverAnswers: 'Le serveur de la RH renvoie une erreur',
        serverAnswersDetail:
            'Votre adresse est bonne et le serveur répond, mais il signale une erreur de son côté. Réessayez dans un instant ; si cela dure, prévenez le Service RH.',
        internetLost: 'Connexion internet perdue',
        internetLostDetail: 'Vérifiez le Wi-Fi ou les données mobiles de l’appareil.',
        draftKept: 'Les informations déjà saisies restent enregistrées sur cet appareil.',
        retry: 'Réessayer',
        retrying: 'Test…',
    },
    notFound: {
        title: 'Adresse introuvable',
        body: 'Cette page n’existe pas dans votre espace employé. Le lien est peut-être incomplet ou ancien.',
        backHome: 'Retour à l’accueil',
        signIn: 'Se connecter',
        hrHint: 'En cas de doute, prévenez le Service RH.',
    },
    /** Replis quand le serveur ne fournit pas de message : les textes du serveur eux-mêmes
        restent en français tant que les fichiers de langue Laravel ne sont pas en place. */
    api: {
        generic: 'Une erreur est survenue.',
        timeout: 'La requête a expiré avant de recevoir une réponse. Réessayez dans un instant.',
        unreachable:
            'Le serveur de la RH n’a pas répondu. Le bandeau affiché en haut de la page explique pourquoi.',
        unexpected: 'Une erreur inattendue est survenue.',
    },
    uploads: {
        or: 'ou',
        units: { b: 'o', kb: 'Ko', mb: 'Mo' },
        hint: (formats: string, max: string) => `Formats acceptés : ${formats} · ${max} maximum`,
        isFile: (ext: string) => `est un fichier ${ext}`,
        noExtension: 'n’a pas d’extension reconnaissable',
        refusedFormat: (name: string, reason: string, formats: string) =>
            `« ${name} » ${reason} : cette pièce doit être au format ${formats}. Choisis un autre fichier.`,
        refusedSize: (name: string, size: string, max: string) =>
            `« ${name} » pèse ${size} : la limite est ${max}. ` +
            'Reprends le scan en qualité réduite, en noir et blanc, ou envoie une page à la fois.',
    },
    date: {
        placeholder: 'JJ-MM-AAAA',
        invalid: 'Date invalide. Format attendu : JJ-MM-AAAA.',
        flagged: '↩️ À corriger — demandé par les RH',
        locale: 'fr-FR',
    },
    photo: {
        capture: '📸 Capturer',
        cancel: 'Annuler',
        chooseFile: '📁 Choisir un fichier',
        useCamera: '📷 Utiliser la caméra',
        remove: 'Retirer',
        cameraDenied: 'Impossible d’accéder à la caméra. Vérifiez les autorisations de votre navigateur.',
    },
    org: {
        outOfHierarchy: (name: string) => `${name} (hors hiérarchie)`,
    },
    censusLock: {
        cta: '📋 Déclarer pendant le recensement',
        redirectedTitle: '📋 Cette déclaration se fait dans le recensement',
        dependent:
            'Tant que le recensement n’est pas validé, tes ayants droit se déclarent ici : une ligne ajoutée séparément ' +
            'arriverait au dossier sans les actes de filiation que les RH sont en train de vérifier.',
        diploma:
            'Tant que le recensement n’est pas validé, tes diplômes se déclarent ici : une ligne ajoutée séparément ' +
            'arriverait au dossier sans son document justificatif.',
    },
    common: {
        matriculeLabel: 'Matricule',
        matriculePlaceholder: 'Ex: 98240812A',
        remove: 'Retirer',
        removeConfirm: (name: string) => `Retirer ${name} ?`,
        reason: (reason: string) => `Motif : ${reason}`,
        attached: (name: string) => `✅ ${name}`,
        send: 'Envoyer',
        sending: 'Envoi...',
        submitting: 'Envoi en cours...',
        supportingDocuments: 'Documents justificatifs',
        back: '← Retour',
        referenceLabel: 'Votre référence',
        goToLogin: 'Aller à la connexion',
        captchaLabel: 'Vérification anti-robot',
        captchaRefresh: '↻ Changer',
        captchaRefreshTitle: 'Obtenir un autre calcul',
        answerPlaceholder: 'Votre réponse',
    },
    dependents: {
        title: 'Ayants Droit',
        add: '+ Déclarer un ayant droit',
        heading: 'Déclarer un Ayant Droit',
        empty: 'Aucun ayant droit déclaré pour le moment.',
        alreadyProcessed: 'Cet ayant droit a déjà été traité par les RH et ne peut plus être retiré ici.',
        age: (years: number) => `${years} ans`,
        relationshipField: 'Lien de parenté',
        relationships: {
            spouse: 'Conjoint(e)',
            child: 'Enfant',
            father: 'Père',
            mother: 'Mère',
        },
        lastName: 'Nom *',
        firstName: 'Prénom(s)',
        birthDate: 'Date de naissance *',
        birthPlace: 'Lieu de naissance',
        genderField: 'Sexe',
        male: 'Masculin',
        female: 'Féminin',
        phone: 'Téléphone',
        photo: 'Photo',
        birthCertificate: 'Acte de naissance *',
        marriageCertificate: 'Acte de mariage *',
        idCard: "Carte d’identité (optionnel)",
        errors: {
            nameAndBirthDate: 'Le nom et la date de naissance sont obligatoires.',
            invalidBirthDate: 'Date de naissance invalide. Format attendu : JJ-MM-AAAA.',
            birthCertificateRequired: 'L’acte de naissance est obligatoire.',
            marriageCertificateRequired: 'L’acte de mariage est obligatoire pour un(e) conjoint(e).',
        },
    },
    diplomas: {
        title: 'Diplômes & Formations',
        add: '+ Ajouter',
        heading: 'Nouveau Diplôme / Formation',
        empty: 'Aucun diplôme ou formation renseigné pour le moment.',
        alreadyValidated: 'Ce diplôme a déjà été validé et ne peut plus être retiré ici.',
        typeField: 'Type',
        types: {
            recruitment_diploma: 'Diplôme de Recrutement',
            highest_diploma: 'Diplôme le Plus Élevé',
            training: 'Formation',
        },
        titleField: 'Intitulé *',
        titlePlaceholder: 'Ex: Licence en Sciences Infirmières',
        institutionField: 'École / Université / Organisme *',
        yearField: "Année d’obtention *",
        documentField: 'Document justificatif *',
        errors: {
            titleAndInstitution: 'L’intitulé et l’établissement sont obligatoires.',
            invalidYear: (maxYear: number) => `Année invalide (entre 1950 et ${maxYear}).`,
            documentRequired: 'Le document justificatif est obligatoire.',
        },
    },
    leaves: {
        title: 'Mes Congés',
        add: '+ Nouvelle demande',
        heading: 'Nouvelle Demande de Congé',
        empty: 'Aucune demande de congé pour le moment.',
        loadFailed: 'Impossible de charger la demande.',
        status: {
            pending: 'En attente',
            approved: 'Approuvé',
            rejected: 'Rejeté',
        },
        currentStep: (step: string) => `Étape en cours : ${step}`,
        split: ' (fractionné)',
        days: (count: number) => `${count} j`,
        daysLong: (count: number) => `${count} jour(s)`,
        returnRecorded: '✅ Retour enregistré',
        returnPending: '⏳ Retour non encore enregistré',
        range: (start: string, end: string) => `${start} → ${end}`,
        secondTake: (start: string, end: string) => `2ème prise : ${start} → ${end}`,
        reasonField: 'Motif',
        destination: 'Destination',
        addressDuringLeave: 'Adresse pendant le congé',
        replacement: 'Intérimaire',
        rejectedTitle: '❌ Demande rejetée',
        approvedTitle: '✅ Demande approuvée définitivement',
        returnedYes: 'Retour enregistré.',
        returnedNo: 'Retour pas encore enregistré par les RH.',
        circuitTitle: 'Circuit de validation',
        actedBy: (name: string) => `Par ${name}`,
        typeField: 'Type de congé',
        balanceLoading: 'Chargement du solde...',
        notEligible: (fromDate: string) => `⚠️ Pas encore éligible${fromDate ? ` (à partir du ${fromDate})` : ''}.`,
        balance: (available: number, entitlement: number) =>
            `Solde : ${available} j disponible(s) sur ${entitlement} (cycle en cours)`,
        noBalance: 'Pas de solde applicable pour ce type.',
        startDate1: 'Date de début (1ère prise) *',
        endDate1: 'Date de fin (1ère prise) *',
        splitToggle: 'Fractionner en 2 prises',
        startDate2: 'Date de début (2ème prise) *',
        endDate2: 'Date de fin (2ème prise) *',
        childrenUnder6: 'Enfants < 6 ans (femme salariée)',
        reasonRequired: 'Motif *',
        documentLabel: (required: boolean) => `Document justificatif ${required ? '*' : '(optionnel)'}`,
        documentHint: 'Décision signée, planning de service, ou autre justificatif',
        submit: 'Soumettre la demande',
        errors: {
            typeRequired: 'Sélectionnez un type de congé.',
            datesInvalid: 'Dates invalides. Format attendu : JJ-MM-AAAA.',
            splitDatesInvalid: 'Renseignez des dates valides (JJ-MM-AAAA) pour la 2ème prise.',
            reasonMissing: 'Le motif est obligatoire.',
            documentRequired: 'Un document justificatif est requis pour ce type de congé.',
        },
    },
    activate: {
        title: 'Activer mon compte',
        intro:
            'Utilisez le matricule et le mot de passe temporaire communiqués par les Ressources Humaines, puis choisissez votre mot de passe définitif.',
        stepOf: (step: number, total: number) => `Étape ${step} sur ${total}`,
        verificationTitle: 'Vérification de sécurité',
        verificationIntro:
            'Dernière étape : confirmez votre année d’entrée et résolvez le petit calcul pour finaliser l’activation de votre compte.',
        reviewTitle: 'Demande transmise aux RH',
        reviewIntro: 'Votre compte n’est pas encore ouvert. Un agent des Ressources Humaines doit vérifier votre identité.',
        temporaryPassword: 'Mot de passe temporaire',
        temporaryPasswordPlaceholder: 'Donné par les RH',
        newPassword: 'Nouveau mot de passe',
        newPasswordPlaceholder: '8 caractères minimum',
        confirmPassword: 'Confirmer le mot de passe',
        continue: 'Continuer',
        checking: 'Vérification...',
        modeExactDate: 'Date exacte',
        modeYearOnly: 'Année seulement',
        recruitmentDate: 'Date de recrutement',
        recruitmentYear: 'Année de recrutement',
        chooseYear: 'Choisissez une année',
        yearIsEnough: 'L’année suffit : le jour et le mois ne sont pas vérifiés.',
        confirm: 'Confirmer et activer mon compte',
        activating: 'Activation...',
        remainingAttempts: (count: number) =>
            `Il vous reste ${count} tentative${count > 1 ? 's' : ''} avant blocage temporaire.`,
        reviewHelp:
            'Impossible de vous rappeler ? Le Service RH peut vérifier votre identité sur place et ouvrir votre compte.',
        requestReview: 'Demander la vérification aux RH',
        alreadyActivated: 'Déjà activé ? Se connecter',
        reviewSteps: {
            note: 'Notez ou gardez cette page ouverte.',
            present: 'Présentez-vous aux Ressources Humaines avec cette référence et votre matricule',
            validated: 'Dès leur validation, votre compte s’ouvre avec le mot de passe que vous avez choisi.',
        },
        errors: {
            all_fields: 'Veuillez remplir tous les champs.',
            password_mismatch: 'Les deux mots de passe ne correspondent pas.',
            password_short: 'Le mot de passe doit contenir au moins 8 caractères.',
            year_required: 'Veuillez indiquer votre année de recrutement.',
            date_required: 'Veuillez indiquer votre date de recrutement.',
            calculation_required: 'Veuillez saisir le résultat du calcul.',
            session_expired: 'La session d’activation a expiré. Veuillez recommencer.',
            verification_incorrect: 'Vérification incorrecte.',
            review_calculation_first: 'Résolvez d’abord le petit calcul, puis envoyez votre demande aux RH.',
            calculation_incorrect: 'Le résultat du calcul est incorrect.',
        },
    },
    forgot: {
        title: 'Mot de passe oublié',
        intro:
            'Aucun mot de passe n’est envoyé automatiquement : le Service RH vous en remet un après avoir vérifié votre identité.',
        matriculeHint: 'Celui inscrit sur votre contrat, à conserver pour le Service RH.',
        neverActivated: 'Ce compte n’a jamais été ouvert : la démarche est l’activation, pas la réinitialisation.',
        continue: 'Continuer',
        preparing: 'Préparation...',
        verifyIntroStart: 'Demande de réinitialisation pour',
        verifyIntroEnd: '. Résolvez le calcul pour enregistrer la demande.',
        submit: 'Demander la réinitialisation',
        validUntil: (date: string) => `Valable jusqu’au ${date}.`,
        steps: {
            note: 'Notez ou gardez cette page ouverte.',
            present: 'Présentez-vous au Service RH avec cette référence et votre matricule',
            identity: 'Après vérification de votre identité, un agent génère un mot de passe temporaire et vous le remet.',
            connect: 'Connectez-vous avec ce mot de passe temporaire, puis changez-le depuis votre espace.',
        },
        expiryNote:
            'Passé le délai, la demande expire et le mot de passe temporaire n’est plus émis : il suffit de relancer la démarche.',
        goToLogin: 'Aller à la connexion',
        backToLogin: 'Retour à la connexion',
        neverOpened: 'Compte jamais ouvert ?',
        activateLink: 'Activer mon compte',
        errors: {
            matriculeRequired: 'Saisissez votre matricule.',
        },
    },
    census: {
        file: {
            emptyFile: (name: string) =>
                `« ${name} » est vide : l’appareil photo ou l’application ne l’a pas enregistré. ` +
                'Reprends la photo, ou choisis un autre fichier.',
            emptyPick: (name: string) => `⚠️ ${name} est vide : sélectionne-le à nouveau.`,
            attached: (name: string, size: string) => `✅ ${name} · ${size}`,
            // Le poids que le serveur transporte dans une seule requête : ni la règle du
            // validateur ni le réseau ne le diront à l'employé, c'est l'envoi qui meurt
            // sans réponse. Les pièces fautives sont nommées, il sait lesquelles reprendre.
            tooHeavy: (names: string, total: string, max: string, pieceMax: string) =>
                `${names} : ${total} à envoyer ensemble. Un envoi est limité à ${max}, une pièce à ${pieceMax}. ` +
                'Le serveur ne lirait pas ça du tout — et ne répondrait pas. Reprends les plus lourdes : ' +
                'rien n’est envoyé pour l’instant, ton brouillon est gardé.',
        },
        // Le miroir navigateur des règles du serveur (src/lib/fieldRules.ts) : ces phrases
        // sont dites champ par champ, pendant la saisie, au lieu d'arriver d'un bloc à la
        // soumission.
        check: {
            wholeNumber: 'Écris un nombre entier, sans lettre ni zéro au début : 1, pas 01.',
            atLeast: (min: number) => `Ce nombre doit être d’au moins ${min}.`,
            year: (min: number, max: number) => `Une année à 4 chiffres, entre ${min} et ${max}.`,
            email: 'Cette adresse email ne semble pas valide : vérifie le « @ » et le nom du domaine.',
            tooLong: (n: number, max: number) => `Trop long : ${n} caractères pour une limite de ${max}.`,
            required: 'Ce champ est obligatoire.',
            todoOne: 'Un point à corriger avant l’envoi :',
            todoMany: (n: number) => `${n} points à corriger avant l’envoi :`,
            todoJump: 'Ouvrir cette étape',
        },
        stages: {
            identity: 'Identité',
            pay: 'Solde & contrat',
            org: 'Affectation',
            family: 'Entourage',
            review: 'Récapitulatif',
        },
        sections: {
            photo: 'Photo',
            personal: 'Informations Personnelles',
            classification: 'Classification Salariale',
            contract: 'Contrat de travail & prise de service',
            bank: 'Informations Bancaires & CNPS',
            organization: 'Affectation Organisationnelle',
            dependents: 'Ayants Droit',
            diplomas: 'Diplômes & Formations',
        },
        fields: {
            matriculeFp: 'Matricule Fonction Publique',
            photoProfile: 'Photo de profil',
            lastName: 'Nom',
            firstName: 'Prénom',
            gender: 'Sexe',
            birthDate: 'Date de naissance',
            maritalStatus: 'Statut marital',
            childrenUnder6: 'Enfants < 6 ans',
            totalChildren: 'Total enfants',
            idCard: "N° Carte d'identité",
            recruitmentDate: 'Date de recrutement',
            serviceStartDate: 'Date de prise de service',
            phone: 'Téléphone',
            email: 'Adresse email',
            address: 'Adresse',
            city: 'Ville',
            category: 'Catégorie',
            echelon: 'Échelon',
            indiceCalculated: 'Indice (calculé)',
            indice: 'Indice :',
            contractNumber: 'Numéro de contrat',
            contractNumberPlaceholder: 'Ex: CT-2024-001',
            contractType: 'Type de contrat',
            contractFixedByHr: 'Fixé par les RH',
            contractDocument: 'Contrat de travail',
            serviceStartDocument: 'Document de prise de service',
            contractAttached: 'Contrat joint',
            serviceStartAttached: 'Prise de service jointe',
            bankName: 'Nom de la banque',
            bankAccount: 'Numéro de compte',
            cnps: 'Numéro CNPS',
            bank: 'Banque',
            bankAccountShort: 'N° de compte',
            cnpsShort: 'N° CNPS',
            branch: 'Branche',
            direction: 'Direction',
            subDirection: 'Sous-direction',
            department: 'Département',
            service: 'Service',
            sectorUnit: 'Unité / Secteur',
            sector: 'Secteur / Unité',
            tradeBody: 'Corps de métier',
            qualification: 'Qualification',
            jobTitle: 'Poste hiérarchique',
            personnelType: 'Type de personnel',
            administrativeStatus: 'Statut administratif',
            institution: 'Établissement *',
            year: 'Année *',
            documentField: 'Document justificatif',
        },
        marital: {
            single: 'Célibataire',
            married: 'Marié(e)',
            divorced: 'Divorcé(e)',
            widowed: 'Veuf/Veuve',
        },
        branchButtons: {
            medical: '🏥 Branche Médicale',
            administrative: '📋 Branche Administrative',
        },
        branchNames: {
            medical: 'Médicale',
            administrative: 'Administrative',
        },
        hints: {
            currentPhoto: 'Photo actuelle (laissez vide pour la conserver)',
            direction: 'Facultatif : restreint les listes suivantes',
            narrowsServices: 'Facultatif : restreint la liste des services',
            chooseServiceFirst: "Choisissez d'abord un service",
            noSector: 'Aucune unité / secteur rattachée à ce service',
            sectorOptional: 'Facultatif : unité ou secteur rattaché au service',
            chooseTradeBodyFirst: "Choisissez d'abord le corps de métier",
            optionalContract:
                'Champs facultatifs : sans numéro ni document, la soumission passe quand même et les RH vous la ' +
                'réclameront à la vérification.',
        },
        notes: {
            classificationCameroon: 'Nomenclature camerounaise (fonctionnaires). L’indice se calcule automatiquement.',
            classificationContract: 'Classification numérique (contractuels). L’indice se calcule automatiquement.',
            orgIntro:
                'Chaque niveau facultatif (direction, département/sous-direction, unité) ne fait que restreindre la liste ' +
                "suivante. Vérifiez bien l'ordre : Direction → Département ou Sous-direction → Service → Unité / Secteur. " +
                'Les RH vérifient ces informations avant la validation finale.',
        },
        bankChanges: {
            bank_name: 'nom de la banque',
            bank_account_number: 'numéro de compte',
            cnps_number: 'numéro CNPS',
        },
        bankWarning: {
            title: '⚠️ Tu modifies tes coordonnées de paiement',
            noValue: 'aucune valeur enregistrée',
            intro: 'Si ces informations ne sont pas celles que la GRH a dans son dossier, ',
            bold1: 'ton salaire ne sera pas viré',
            middle: " tant que la différence n'est pas régularisée. Un changement avéré doit être accompagné d'une ",
            bold2: 'demande de modification des informations bancaires adressée au Directeur Général',
            ending: ' (avec un RIB à ton nom joint) : sans ce document, la valeur déjà enregistrée reste la référence.',
            ack: "J'ai lu cet avertissement et je prépare la demande adressée au Directeur Général.",
            ackRequired: 'Cette case est obligatoire pour pouvoir soumettre.',
            recap: (names: string) =>
                `⚠️ Changement déclaré : ${names}. Avertissement sur le virement acté — une demande de modification ` +
                'des informations bancaires doit accompagner le dossier.',
        },
        labels: {
            flaggedBadge: 'à corriger',
            dash: '—',
            newSuffix: '· nouveau',
            none: 'Aucun.',
            edit: 'Modifier',
            restore: 'Rétablir',
            cancel: 'Annuler',
            save: 'Enregistrer',
            previous: '← Précédent',
            reviewCta: 'Vérifier et Soumettre',
            backToForm: '← Retour pour corriger',
            confirmSubmit: 'Confirmer et Soumettre',
            sending: 'Envoi...',
            offlineSubmit: 'Hors ligne — envoi impossible',
            retry: 'Réessayer',
            hide: 'Masquer',
            discardDraft: 'Repartir des données du serveur',
            bornOn: (date: string) => `· né(e) le ${date}`,
            level: (level: number) => `Niveau ${level}`,
            personNamed: (relationship: string, name: string) => `${relationship} « ${name} »`,
            refusedOne: "Un champ bloque encore l'envoi",
            refusedMany: (count: number) => `${count} champs bloquent l'envoi`,
            refusedFooter: (reviewLabel: string) =>
                "Rien n'est perdu : ton brouillon reste sur cet appareil. Corrige ces points, puis reviens à " +
                `${reviewLabel} pour confirmer l'envoi.`,
            offlineButtonNote: 'Le réseau est revenu ? Le bouton se réactive tout seul. Ton brouillon reste sur cet appareil.',
            draftNoteReview:
                '✏️ Ton brouillon est enregistré sur cet appareil à chaque modification : tu peux fermer la page ' +
                "ou perdre la connexion, rien n'est perdu.",
            draftNoteForm:
                '✏️ Tes saisies sont enregistrées sur cet appareil à chaque modification : tu peux fermer la page ' +
                "ou perdre la connexion, rien n'est perdu.",
        },
        screens: {
            offlineTitle: 'Connexion internet nécessaire',
            offlineText:
                "Impossible d'ouvrir la campagne de recensement sans réseau. Ton brouillon est enregistré sur cet " +
                "appareil et rien n'est perdu.",
            noCampaign: "Aucune campagne de recensement n'est actuellement ouverte.",
            submitted: 'Recensement soumis',
            validated: 'Recensement validé',
            validatedText: 'Vos informations ont été mises à jour.',
            reviewIntro: 'Vérifiez attentivement vos informations avant de soumettre définitivement.',
            rejectionFields: 'Champs à corriger (clique pour y aller) :',
            rejectionHint: 'Les champs concernés sont surlignés en rouge ci-dessous. Corrigez-les et resoumettez.',
            canceledFallback: 'Recensement annulé par les RH',
            canceledHint: 'Vérifiez vos informations ci-dessous et resoumettez.',
            restoredTitle: '📝 Brouillon retrouvé sur cet appareil',
            restoredText: (date: string) =>
                `Enregistré le ${date}. Tes saisies ont été conservées et tu peux continuer directement.`,
        },
        modals: {
            dependentTitle: 'Ayant Droit',
            diplomaTitle: 'Diplôme / Formation',
            emptyDependents: 'Aucun ayant droit déclaré.',
            emptyDiplomas: 'Aucun diplôme/formation déclaré.',
            actEmployee: "Acte de naissance de l'employé",
            actDependent: "Acte de naissance de l'ayant droit",
            marriageCertificate: 'Acte de mariage',
            suffixRequired: '*',
            suffixIfChanged: '(joindre si changement)',
            suffixAlreadyProvided: '(facultatif — déjà fourni)',
            actCoveredNote:
                '✅ La pièce qui prouve la filiation est déjà au dossier pour un autre parent : elle servira pour cette ' +
                'déclaration, inutile de la renvoyer.',
            actEmployeeNote:
                "C'est TON acte de naissance qui prouve la filiation avec ce parent — la même pièce sert pour le père " +
                'et la mère.',
            contractDocLink: '📄 Contrat déjà enregistré (joignez un fichier pour le remplacer)',
            serviceStartDocLink: '📄 Prise de service déjà enregistrée (joignez un fichier pour la remplacer)',
        },
        alerts: {
            actParentRequired: (who: string) =>
                `Pour déclarer ${who}, joins TON acte de naissance : c'est lui qui prouve la filiation. ` +
                'Une seule pièce suffit pour le père et la mère.',
            actMissing: (who: string) =>
                `${who} : son acte de naissance n'est pas joint. Ouvre sa ligne et sélectionne le fichier — une pièce ` +
                'vide ou trop lourde est écartée par le serveur sans que le formulaire le sache.',
            actParentInModal: "Pour déclarer un parent, joins TON acte de naissance : c'est lui qui prouve la filiation.",
            actRequiredFor: (who: string) =>
                `Pour ${who}, l'acte de naissance est obligatoire. Vérifie que le fichier n'est pas vide (0 octet) : ` +
                'reprends la photo au besoin.',
            diplomaDocForEach: 'Un document justificatif est requis pour chaque nouveau diplôme.',
            diplomaDocRequired: 'Un document justificatif est obligatoire pour un nouveau diplôme.',
            invalidYear: 'Année invalide.',
            offlineSubmit:
                'Connexion internet introuvable : rien ne peut être envoyé pour le moment. Ton brouillon est enregistré ' +
                'sur cet appareil, tu pourras soumettre dès que le réseau revient.',
            submitted: 'Ton recensement a été soumis pour validation.',
            bankChanges: (names: string, section: string) =>
                `Tu as modifié ${names}. Coche la reconnaissance de l'avertissement dans la section « ${section} » ` +
                'avant de vérifier et soumettre.',
            // Le serveur n'a rien répondu : soit le réseau a lâché en cours de transfert,
            // soit les pièces pesaient plus que ce que le serveur accepte de lire. Le
            // formulaire refuse déjà ce poids (census.file.tooHeavy) — mais sa marge est
            // celle du php.ini d'ici. Ailleurs, un volume qu'il laisse passer peut quand
            // même mourir en route : les deux causes restent à dire.
            sendCut: (count: number, total: string) =>
                `L'envoi n'est pas arrivé au bout : ${count} pièce${count > 1 ? 's' : ''} jointe${count > 1 ? 's' : ''} ` +
                `partent avec le formulaire (${total} au total) et aucune réponse du serveur n'est revenue. Soit la ` +
                'connexion a été coupée pendant le transfert, soit ces pièces sont trop lourdes pour lui : reprends ' +
                'les plus grosses, plus légères, et relance — ton brouillon est gardé, rien n’est perdu.',
        },
    },
    profile: {
        loadFailed: 'Impossible de charger le profil.',
        photoTitle: 'Changer la photo',
        sections: {
            assignment: 'Affectation',
            contact: 'Coordonnées',
            security: 'Sécurité',
            danger: 'Zone Dangereuse',
        },
        fields: {
            tradeBody: 'Corps de métier',
            qualification: 'Qualification',
            jobTitle: 'Poste',
            service: 'Service',
            status: 'Statut',
            phone: 'Téléphone',
            email: 'Adresse email',
            address: 'Adresse',
            city: 'Ville',
            currentPassword: 'Mot de passe actuel',
            newPassword: 'Nouveau mot de passe',
            confirmPassword: 'Confirmer le nouveau mot de passe',
            reason: 'Motif',
            notes: 'Précisions (optionnel)',
        },
        reasonOptions: {
            resignation: 'Démission',
            retirement: 'Retraite',
            other: 'Autre',
        },
        dash: '—',
        hiddenPassword: '••••••••',
        edit: 'Modifier',
        cancel: 'Annuler',
        saving: 'Enregistrement...',
        save: 'Enregistrer',
        changePassword: 'Changer le mot de passe',
        confirm: 'Confirmer',
        passwordChanged: '✅ Mot de passe modifié avec succès.',
        dangerIntro:
            "Supprimer votre compte met fin à votre accès à l'application (mobile et web). Votre dossier employé " +
            '(informations personnelles, ayants droit, diplômes, historique) est conservé intégralement dans le système RH.',
        deleteAccount: 'Supprimer mon compte',
        deleteWarning:
            'Cette action est irréversible. Vous ne pourrez plus vous connecter tant qu\'un administrateur ne créera pas un nouveau compte.',
        confirmWord: 'SUPPRIMER',
        typeToConfirm: (word: string) => `Tapez ${word} pour confirmer`,
        deleting: 'Suppression...',
        deleteForever: 'Supprimer définitivement',
        errors: {
            allFields: 'Veuillez remplir tous les champs.',
            passwordMismatch: 'Les deux nouveaux mots de passe ne correspondent pas.',
            passwordShort: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
            confirmWord: (word: string) => `Veuillez taper ${word} pour confirmer.`,
            passwordRequired: 'Veuillez saisir votre mot de passe.',
        },
    },
    preferences: {
        title: 'Préférences',
        intro:
            'Ils s’appliquent immédiatement, sans bouton à valider. La langue, l’apparence et la police suivent votre compte sur vos autres appareils ; l’adresse du serveur reste réglée sur celui que vous utilisez, car elle dépend du réseau où vous êtes branché.',
        storageRefused:
            'Réglage appliqué maintenant, mais il ne sera pas retrouvé à la prochaine ouverture et ne suivra pas votre compte : ce navigateur refuse d’enregistrer des préférences (navigation privée, extension de confidentialité).',
        theme: {
            section: 'Apparence',
            label: 'Thème',
            hint:
                '« Système » suit le réglage de votre appareil, y compris lorsqu’il change pendant que vous utilisez le portail. Seuls les fonds passent en sombre : la mise en page et les couleurs de chaque bouton restent les mêmes.',
            options: {
                light: 'Clair',
                dark: 'Sombre',
                system: 'Système',
            },
        },
        font: {
            section: 'Police d’écriture',
            sizeLabel: 'Taille du texte',
            sizeHint: 'Toute l’interface suit, y compris les boutons et les tableaux, et non le texte seul.',
            sizeOptions: {
                sm: 'Petit',
                md: 'Normal',
                lg: 'Grand',
            },
            familyLabel: 'Style de police',
            familyHint:
                'Ce sont des polices déjà installées sur l’ordinateur ou le téléphone : rien n’est téléchargé, donc le portail reste lisible sans connexion Internet.',
            familyOptions: {
                system: 'Standard',
                arial: 'Arial',
                verdana: 'Verdana',
                georgia: 'Georgia',
            },
        },
        sync: {
            section: 'Compte et appareils',
            states: {
                reading: 'Lecture de votre compte en cours…',
                queued: 'Vos réglages viennent de changer : enregistrement dans un instant.',
                writing: 'Enregistrement sur votre compte en cours…',
                syncedJustNow: 'Vos réglages sont enregistrés sur votre compte : ils vous suivront sur tout appareil où vous vous reconnecterez.',
                syncedAligned: 'Rien à enregistrer : cet appareil et votre compte ont exactement les mêmes réglages.',
                lastExchangeAt: (time: string) => `Dernier échange avec le compte à ${time}.`,
                offline:
                    'Le serveur n’a pas répondu : vos réglages restent appliqués sur cet appareil, et votre compte garde sa copie précédente. Réessayez quand la connexion revient.',
                noRoute:
                    'Le serveur d’API joint ne connaît pas encore les réglages de compte : ce portail est plus récent que lui. Vos réglages fonctionnent sur cet appareil, mais ils ne vous suivront pas ailleurs tant que le serveur n’est pas mis à jour — signalez-le au Service RH.',
                refused: (status: number) =>
                    `Le serveur a refusé l’enregistrement (code ${status}) : votre compte garde sa copie précédente. Ce navigateur et ce serveur n’ont probablement pas la même version.`,
            },
            retry: 'Synchroniser maintenant',
            retryHint: 'Relit le compte et lui renvoie ce qui manque, sans recharger la page.',
            note:
                'Suivent votre compte : la langue, l’apparence et la police. Reste réglé sur cet appareil : l’adresse du serveur, puisqu’elle dépend du réseau où vous êtes branché.',
        },
        language: {
            section: 'Langue',
            hint:
                'C’est le réglage choisi ici qui sert dans tout le portail ; les écrans de connexion et d’activation gardent leurs boutons FR / EN, car ils se passent avant que l’on sache qui vous êtes.',
        },
        server: {
            section: 'Serveur',
            currentLabel: 'Adresse en service',
            currentHint: (origin: string) => `Choisie par ${origin}.`,
            origins: {
                override: 'votre réglage de ce navigateur',
                config: 'le fichier de configuration posé sur le serveur',
                build: 'l’adresse embarquée dans la version installée',
            },
            sameOrigin: 'même origine que cette page',
            testButton: 'Tester la connexion',
            testAgainButton: 'Tester de nouveau',
            testing: 'Test en cours…',
            ok: (ms: number, name: string) => `✅ Serveur joint en ${ms} ms : ${name}.`,
            okNoName: (ms: number) => `✅ Serveur joint en ${ms} ms.`,
            http: (status: number) =>
                `⚠️ Une réponse est bien arrivée, mais le serveur renvoie une erreur HTTP ${status}. L’adresse est peut-être celle du site au lieu de celle de l’API : elle se termine normalement par « /api ».`,
            timeout: (seconds: number) =>
                `⏱️ Aucune réponse au bout de ${seconds} secondes. Le serveur ne répond pas, ou met plus de temps que cette limite.`,
            opaque:
                '⚠️ Le serveur a bien répondu, mais le navigateur interdit la lecture de sa réponse : l’adresse de ce site ne figure pas dans la liste des sites autorisés par l’API (réglage du serveur).',
            unreachable:
                '❌ Cette adresse n’a pas répondu, ou le navigateur a bloqué la requête avant de l’envoyer. Les deux se ressemblent depuis la page : vérifiez l’adresse saisie, puis l’accès au réseau.',
            mixedContent:
                '🚫 Le navigateur ne peut pas tester cette adresse : cette page est servie en connexion sécurisée (https), et un serveur local en http ne peut pas être appelé depuis une page sécurisée.',
            mixedContentHowTo:
                'Dans la structure, ouvrez directement l’adresse du serveur local dans le navigateur (par exemple http://116.72.30.12:8084). La page et l’API partent alors de la même origine : les appels ne sont plus bloqués, et ce réglage devient inutile.',
            overrideTitle: 'Adresse à utiliser depuis ce navigateur',
            overrideHint:
                'À réserver au réseau local de la structure, ou à un dépannage. Tant que ce champ est vide, c’est l’adresse prévue par le serveur qui s’applique.',
            overridePlaceholder: 'Ex : http://116.72.30.12:8084/api',
            save: 'Enregistrer',
            clear: 'Revenir à l’adresse du serveur',
            saved: 'Adresse enregistrée pour ce navigateur. Elle s’applique dès l’appel suivant, sans vous déconnecter.',
            cleared: 'Votre réglage a été supprimé : c’est de nouveau l’adresse du serveur qui s’applique.',
            invalidAddress:
                'Adresse incomplète : indiquez le serveur avec « http:// » ou « https:// », ou un chemin commençant par « / », par exemple « /api ».',
            emptyAddress: 'Saisissez une adresse, ou choisissez « Revenir à l’adresse du serveur ».',
            notStoredAddress:
                'Adresse appliquée tout de suite, mais ce navigateur refuse de l’enregistrer : elle sera oubliée à la prochaine ouverture.',
        },
    },
};

export type Dict = typeof fr;
