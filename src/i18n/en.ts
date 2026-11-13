import type { Dict } from './fr';

/**
 * Le français étant la langue par défaut, `fr` sert de contrat : toute chaîne anglaise
 * manquante (ou de signature différente) est une erreur de compilation, pas un écran
 * à moitié traduit.
 *
 * « Matricule » et « Recensement » restent en français même dans cette version : ce
 * sont les noms tels que l'hôpital les emploie sur ses formulaires et à l'accueil.
 */
export const en: Dict = {
    switcher: {
        fieldset: 'Interface language',
        fr: 'French',
        en: 'English',
    },
    doc: {
        title: 'Employee space',
    },
    layout: {
        brand: 'KitHRM',
        expandMenu: 'Expand the menu',
        collapseMenu: 'Collapse the menu',
        openMenu: 'Open the menu',
        closeMenu: 'Close the menu',
        logout: 'Sign out',
        nav: {
            home: 'Home',
            profile: 'My Profile',
            leaves: 'My Leave',
            dependents: 'Dependents',
            diplomas: 'Diplomas',
            census: 'Recensement',
            preferences: 'Preferences',
        },
    },
    login: {
        title: 'Sign in',
        subtitle: 'Access your employee space',
        matriculeLabel: 'Matricule',
        matriculePlaceholder: 'e.g. 98240812A',
        passwordLabel: 'Password',
        missingFields: 'Please enter your Matricule and your password.',
        submitting: 'Signing in...',
        submit: 'Sign in',
        lockedRetry: (minutes: number) => `You can try again in ${minutes} minute(s).`,
        attemptsWithoutHelp: (used: number, max: number, lockMinutes: number) =>
            `Failed attempt ${used} of ${max}. On failure ${max}, the account will be paused for ${lockMinutes} minutes.`,
        attemptsWithHelp: (used: number, max: number, helpAfter: number, lockMinutes: number) =>
            `Failed attempt ${used} of ${max}. Help will appear after ${helpAfter} attempts; on failure ${max}, the account will be paused for ${lockMinutes} minutes.`,
        showHelp: 'Need help? Show what to do',
        firstConnectionLink: 'First sign-in? Activate my account',
        helpTitle: 'Cannot sign in?',
        helpNeedsActivation:
            'Your account has never been opened: what you need is activation, using the temporary password given to you by the HR Department.',
        helpLocked:
            'Your account is paused after several failed attempts. You can still start one of these steps right away:',
        helpChoices:
            'You have three options. An HR Department officer checks your identity in person, then processes your request:',
        activateLink: 'Activate my account',
        activateTag: 'first sign-in',
        forgotLink: 'Forgot password',
        forgotTag: 'reset',
        keepTrying: (attemptsLeft: number) => `Keep trying (${attemptsLeft} attempt(s) left)`,
    },
    home: {
        greeting: 'Hello,',
        notFilled: 'Not set',
        matricule: 'Matricule',
        jobTitle: 'Position',
        department: 'Department',
        quickAccessTitle: 'Quick access',
        quickLinks: {
            career: 'My career',
            dependents: 'Dependents',
            diplomas: 'Diplomas',
            leaves: 'Leave',
            census: 'Recensement',
        },
        unavailableTooltip: 'Not available on the web yet',
        comingSoon: 'Soon',
        absences: 'Absences',
        portalTitle: 'Your HR space',
        portalSubtitle: 'A complete, secure portal available around the clock',
        services: {
            payslips: { label: 'Payslips', desc: 'View and download your payslips' },
            leaves: { label: 'Leave & Absence', desc: 'Request and track your leave online' },
            file: { label: 'Personnel file', desc: 'Open your complete personal file' },
            training: { label: 'Continuing training', desc: 'Sign up for available courses' },
            reviews: { label: 'Appraisals', desc: 'View your performance appraisals' },
            news: { label: 'HR news', desc: 'Stay informed about staff updates' },
        },
        publicationsTitle: '📚 Publications & official documents',
        publicationsSubtitle:
            'Rules, collective agreement, circulars and other information that matters to staff',
        publications: {
            rules: { label: 'Internal regulations', desc: 'Code of conduct, discipline and operating rules' },
            convention: { label: 'Collective agreement', desc: 'Staff rights, duties and working conditions' },
            reforms: { label: 'New reforms', desc: 'Latest reforms and regulatory updates' },
            retirees: { label: 'Retired staff', desc: 'Information and entitlements for retirees' },
            circulars: { label: 'Circulars & memos', desc: 'Official communications from the Director General' },
            courses: { label: 'Training & internships', desc: 'Professional development opportunities' },
        },
    },
    connection: {
        serverUnreachable: 'The HR server cannot be reached',
        serverUnreachableDetail:
            'Your network is working, but the server did not answer. Try again in a moment.',
        originBlocked: 'The server answers, but your browser refuses to read its replies',
        originBlockedDetail:
            'This page’s address is not on the list of addresses the HR server accepts. It is not your connection: tell the HR department.',
        mixedContent: 'This page is secure, the HR server is not',
        mixedContentDetail:
            'A browser cannot call an “http” address from a secure page. On site, open the local server address directly, for example http://116.72.30.12:8084.',
        serverAnswers: 'The HR server is returning an error',
        serverAnswersDetail:
            'Your address is right and the server is answering, but it reports an error on its side. Try again in a moment; if it lasts, tell the HR department.',
        internetLost: 'Internet connection lost',
        internetLostDetail: 'Check this device’s Wi-Fi or mobile data.',
        draftKept: 'Anything you have already entered stays saved on this device.',
        retry: 'Try again',
        retrying: 'Checking…',
    },
    notFound: {
        title: 'Address not found',
        body: 'This page does not exist in your employee space. The link may be incomplete or out of date.',
        backHome: 'Back to the home page',
        signIn: 'Sign in',
        hrHint: 'When in doubt, let the Human Resources department know.',
    },
    api: {
        generic: 'An error occurred.',
        timeout: 'The request timed out before any reply. Try again in a moment.',
        unreachable:
            'The HR server did not answer. The banner at the top of the page explains why.',
        unexpected: 'An unexpected error occurred.',
    },
    uploads: {
        or: 'or',
        units: { b: 'B', kb: 'KB', mb: 'MB' },
        hint: (formats: string, max: string) => `Accepted formats: ${formats} · ${max} maximum`,
        isFile: (ext: string) => `is a ${ext} file`,
        noExtension: 'has no recognizable extension',
        refusedFormat: (name: string, reason: string, formats: string) =>
            `“${name}” ${reason}: this document must be ${formats}. Please choose another file.`,
        refusedSize: (name: string, size: string, max: string) =>
            `“${name}” is ${size}; the limit is ${max}. ` +
            'Rescan it at lower quality or in black and white, or send one page at a time.',
    },
    // Les écrans gardent l'ordre jour-mois-année côté anglais : c'est celui du masque de
    // saisie et celui des formulaires papier de l'hôpital. Seuls les mots se traduisent.
    date: {
        placeholder: 'DD-MM-YYYY',
        invalid: 'Invalid date. Expected format: DD-MM-YYYY.',
        flagged: '↩️ To correct — requested by HR',
        locale: 'en-GB',
    },
    photo: {
        capture: '📸 Take photo',
        cancel: 'Cancel',
        chooseFile: '📁 Choose a file',
        useCamera: '📷 Use the camera',
        remove: 'Remove',
        cameraDenied: 'The camera cannot be reached. Check your browser permissions.',
    },
    org: {
        outOfHierarchy: (name: string) => `${name} (outside the hierarchy)`,
        outOfNomenclature: (value: string) => `${value} (outdated category, to reclassify)`,
    },
    censusLock: {
        cta: '📋 Declare it during the Recensement',
        redirectedTitle: '📋 This is declared inside the Recensement',
        dependent:
            'Until your Recensement is validated, dependents are declared there: a line added separately ' +
            'would reach the personnel file without the birth records the HR Department is checking.',
        diploma:
            'Until your Recensement is validated, diplomas are declared there: a line added separately ' +
            'would reach the personnel file without its supporting document.',
    },
    common: {
        matriculeLabel: 'Matricule',
        matriculePlaceholder: 'e.g. 98240812A',
        remove: 'Remove',
        removeConfirm: (name: string) => `Remove ${name}?`,
        reason: (reason: string) => `Reason: ${reason}`,
        attached: (name: string) => `✅ ${name}`,
        send: 'Send',
        sending: 'Sending...',
        submitting: 'Submitting...',
        supportingDocuments: 'Supporting documents',
        back: '← Back',
        referenceLabel: 'Your reference',
        goToLogin: 'Go to the sign-in page',
        captchaLabel: 'Anti-bot check',
        captchaRefresh: '↻ Change',
        captchaRefreshTitle: 'Get another calculation',
        answerPlaceholder: 'Your answer',
    },
    dependents: {
        title: 'Dependents',
        add: '+ Declare a dependent',
        heading: 'Declare a Dependent',
        empty: 'No dependent has been declared yet.',
        alreadyProcessed: 'This dependent has already been processed by the HR Department and can no longer be removed here.',
        age: (years: number) => `${years} years old`,
        relationshipField: 'Relationship',
        relationships: {
            spouse: 'Spouse',
            child: 'Child',
            father: 'Father',
            mother: 'Mother',
        },
        lastName: 'Last name *',
        firstName: 'First name(s)',
        birthDate: 'Date of birth *',
        birthPlace: 'Place of birth',
        genderField: 'Sex',
        male: 'Male',
        female: 'Female',
        phone: 'Phone',
        photo: 'Photo',
        birthCertificate: 'Birth certificate *',
        marriageCertificate: 'Marriage certificate *',
        idCard: 'ID card (optional)',
        errors: {
            nameAndBirthDate: 'The last name and the date of birth are required.',
            invalidBirthDate: 'Invalid date of birth. Expected format: DD-MM-YYYY.',
            birthCertificateRequired: 'The birth certificate is required.',
            marriageCertificateRequired: 'The marriage certificate is required for a spouse.',
        },
    },
    diplomas: {
        title: 'Diplomas & Training',
        add: '+ Add',
        heading: 'New Diploma / Training',
        empty: 'No diploma or training has been recorded yet.',
        alreadyValidated: 'This diploma has already been validated and can no longer be removed here.',
        typeField: 'Type',
        types: {
            recruitment_diploma: 'Recruitment diploma',
            highest_diploma: 'Highest diploma',
            training: 'Training',
        },
        titleField: 'Title *',
        titlePlaceholder: 'e.g. Bachelor in Nursing',
        institutionField: 'School / University / Organization *',
        yearField: 'Year obtained *',
        documentField: 'Supporting document *',
        errors: {
            titleAndInstitution: 'The title and the institution are required.',
            invalidYear: (maxYear: number) => `Invalid year (between 1950 and ${maxYear}).`,
            documentRequired: 'The supporting document is required.',
        },
    },
    leaves: {
        title: 'My Leave',
        add: '+ New request',
        heading: 'New Leave Request',
        empty: 'No leave request yet.',
        loadFailed: 'The request could not be loaded.',
        status: {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
        },
        currentStep: (step: string) => `Current step: ${step}`,
        split: ' (split)',
        days: (count: number) => `${count} d`,
        daysLong: (count: number) => `${count} day(s)`,
        returnRecorded: '✅ Return recorded',
        returnPending: '⏳ Return not recorded yet',
        range: (start: string, end: string) => `${start} → ${end}`,
        secondTake: (start: string, end: string) => `2nd period: ${start} → ${end}`,
        reasonField: 'Reason',
        destination: 'Destination',
        addressDuringLeave: 'Address during the leave',
        replacement: 'Covering staff member',
        rejectedTitle: '❌ Request rejected',
        approvedTitle: '✅ Request finally approved',
        returnedYes: 'Return recorded.',
        returnedNo: 'The return has not been recorded by the HR Department yet.',
        circuitTitle: 'Approval circuit',
        actedBy: (name: string) => `By ${name}`,
        typeField: 'Leave type',
        balanceLoading: 'Loading the balance...',
        notEligible: (fromDate: string) => `⚠️ Not eligible yet${fromDate ? ` (from ${fromDate})` : ''}.`,
        balance: (available: number, entitlement: number) =>
            `Balance: ${available} day(s) available out of ${entitlement} (current cycle)`,
        noBalance: 'No balance applies to this type.',
        startDate1: 'Start date (1st period) *',
        endDate1: 'End date (1st period) *',
        splitToggle: 'Split into 2 periods',
        startDate2: 'Start date (2nd period) *',
        endDate2: 'End date (2nd period) *',
        childrenUnder6: 'Children under 6 (female employee)',
        reasonRequired: 'Reason *',
        documentLabel: (required: boolean) => `Supporting document ${required ? '*' : '(optional)'}`,
        documentHint: 'Signed decision, service schedule, or any other proof',
        submit: 'Submit the request',
        errors: {
            typeRequired: 'Please select a leave type.',
            datesInvalid: 'Invalid dates. Expected format: DD-MM-YYYY.',
            splitDatesInvalid: 'Enter valid dates (DD-MM-YYYY) for the 2nd period.',
            reasonMissing: 'The reason is required.',
            documentRequired: 'A supporting document is required for this leave type.',
        },
    },
    activate: {
        title: 'Activate my account',
        intro:
            'Use the Matricule and the temporary password given to you by the Human Resources department, then choose your final password.',
        stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
        verificationTitle: 'Security check',
        verificationIntro:
            'Last step: confirm your year of entry and solve the small calculation to finish activating your account.',
        reviewTitle: 'Request sent to the HR Department',
        reviewIntro: 'Your account is not open yet. A Human Resources officer has to verify your identity.',
        temporaryPassword: 'Temporary password',
        temporaryPasswordPlaceholder: 'Given to you by HR',
        newPassword: 'New password',
        newPasswordPlaceholder: '8 characters minimum',
        confirmPassword: 'Confirm the password',
        continue: 'Continue',
        checking: 'Checking...',
        modeExactDate: 'Exact date',
        modeYearOnly: 'Year only',
        recruitmentDate: 'Recruitment date',
        recruitmentYear: 'Recruitment year',
        chooseYear: 'Choose a year',
        yearIsEnough: 'The year is enough: the day and month are not checked.',
        confirm: 'Confirm and activate my account',
        activating: 'Activating...',
        remainingAttempts: (count: number) =>
            `You have ${count} attempt${count > 1 ? 's' : ''} left before a temporary block.`,
        reviewHelp:
            'Cannot remember it? The HR Department can check your identity in person and open your account.',
        requestReview: 'Ask HR to verify',
        alreadyActivated: 'Already activated? Sign in',
        reviewSteps: {
            note: 'Write it down or keep this page open.',
            present: 'Go to the Human Resources department with this reference and your Matricule',
            validated: 'As soon as they validate it, your account opens with the password you chose.',
        },
        errors: {
            all_fields: 'Please fill in every field.',
            password_mismatch: 'The two passwords do not match.',
            password_short: 'The password must be at least 8 characters long.',
            year_required: 'Please give your recruitment year.',
            date_required: 'Please give your recruitment date.',
            calculation_required: 'Please enter the result of the calculation.',
            session_expired: 'The activation session has expired. Please start again.',
            verification_incorrect: 'Incorrect verification.',
            review_calculation_first: 'Solve the small calculation first, then send your request to HR.',
            calculation_incorrect: 'The result of the calculation is incorrect.',
        },
    },
    forgot: {
        title: 'Forgot password',
        intro:
            'No password is sent automatically: an HR Department officer hands you a new one after checking your identity.',
        matriculeHint: 'The one printed on your contract — keep it for the HR Department.',
        neverActivated: 'This account has never been opened: what you need is activation, not a reset.',
        continue: 'Continue',
        preparing: 'Preparing...',
        verifyIntroStart: 'Reset request for',
        verifyIntroEnd: '. Solve the calculation to record the request.',
        submit: 'Request the reset',
        validUntil: (date: string) => `Valid until ${date}.`,
        steps: {
            note: 'Write it down or keep this page open.',
            present: 'Go to the HR Department with this reference and your Matricule',
            identity: 'Once your identity is checked, an officer generates a temporary password and gives it to you.',
            connect: 'Sign in with that temporary password, then change it inside your space.',
        },
        expiryNote:
            'After the deadline the request expires and no temporary password is issued: simply start the step again.',
        goToLogin: 'Go to the sign-in page',
        backToLogin: 'Back to sign-in',
        neverOpened: 'Account never opened?',
        activateLink: 'Activate my account',
        errors: {
            matriculeRequired: 'Please enter your Matricule.',
        },
    },
    census: {
        file: {
            emptyFile: (name: string) =>
                `“${name}” is empty: the camera or the app did not save it. ` +
                'Take the photo again, or choose another file.',
            emptyPick: (name: string) => `⚠️ ${name} is empty: select it again.`,
            attached: (name: string, size: string) => `✅ ${name} · ${size}`,
            // The weight one request can carry: neither the validation rule nor the network
            // would tell the employee — the send simply dies without an answer. The offending
            // files are named so it is clear which ones to redo.
            tooHeavy: (names: string, total: string, max: string, pieceMax: string) =>
                `${names}: ${total} to send together. One send is limited to ${max}, one file to ${pieceMax}. ` +
                'The server would not read that at all — and would not answer. Redo the heaviest ones: ' +
                'nothing is sent for now, your draft is kept.',
        },
        // Browser-side mirror of the server rules (src/lib/fieldRules.ts): these lines are
        // spoken field by field while the employee types, instead of arriving as one block
        // at submission time.
        check: {
            wholeNumber: 'Write a whole number, with no letter and no leading zero: 1, not 01.',
            atLeast: (min: number) => `This number must be at least ${min}.`,
            year: (min: number, max: number) => `A 4-digit year, between ${min} and ${max}.`,
            email: 'This email address does not look valid: check the “@” and the domain name.',
            tooLong: (n: number, max: number) => `Too long: ${n} characters against a limit of ${max}.`,
            required: 'This field is required.',
            todoOne: 'One point to fix before sending:',
            todoMany: (n: number) => `${n} points to fix before sending:`,
            todoJump: 'Open this step',
        },
        stages: {
            identity: 'Identity',
            pay: 'Pay & contract',
            org: 'Assignment',
            family: 'Household',
            review: 'Summary',
        },
        sections: {
            photo: 'Photo',
            personal: 'Personal Information',
            classification: 'Salary Classification',
            contract: 'Employment contract & start of service',
            bank: 'Bank & CNPS',
            organization: 'Organizational Assignment',
            dependents: 'Dependents',
            diplomas: 'Diplomas & Training',
        },
        fields: {
            matriculeFp: 'Civil Service Matricule',
            photoProfile: 'Profile photo',
            lastName: 'Last name',
            firstName: 'First name',
            gender: 'Sex',
            birthDate: 'Date of birth',
            maritalStatus: 'Marital status',
            childrenUnder6: 'Children under 6',
            totalChildren: 'Total children',
            idCard: 'ID card number',
            recruitmentDate: 'Recruitment date',
            serviceStartDate: 'Start-of-service date',
            phone: 'Phone',
            email: 'Email address',
            address: 'Address',
            city: 'City',
            category: 'Category',
            echelon: 'Step',
            indiceCalculated: 'Index (calculated)',
            indice: 'Index:',
            contractNumber: 'Contract number',
            contractNumberPlaceholder: 'e.g. CT-2024-001',
            contractType: 'Contract type',
            contractFixedByHr: 'Set by the HR Department',
            contractDocument: 'Employment contract',
            serviceStartDocument: 'Start-of-service document',
            contractAttached: 'Contract attached',
            serviceStartAttached: 'Start-of-service document attached',
            bankName: 'Bank name',
            bankAccount: 'Account number',
            cnps: 'CNPS number',
            bank: 'Bank',
            bankAccountShort: 'Account no.',
            cnpsShort: 'CNPS no.',
            branch: 'Branch',
            direction: 'Directorate',
            subDirection: 'Sub-directorate',
            department: 'Department',
            service: 'Service',
            sectorUnit: 'Unit / Sector',
            sector: 'Sector / Unit',
            tradeBody: 'Trade group',
            qualification: 'Qualification',
            jobTitle: 'Hierarchical position',
            personnelType: 'Personnel type',
            administrativeStatus: 'Administrative status',
            institution: 'Institution *',
            year: 'Year *',
            documentField: 'Supporting document',
        },
        marital: {
            single: 'Single',
            married: 'Married',
            divorced: 'Divorced',
            widowed: 'Widow(er)',
        },
        branchButtons: {
            medical: '🏥 Medical Branch',
            administrative: '📋 Administrative Branch',
            unknown: '🧭 Not sure',
        },
        branchNames: {
            medical: 'Medical',
            administrative: 'Administrative',
        },
        hints: {
            currentPhoto: 'Current photo (leave empty to keep it)',
            direction: 'Optional: narrows the lists below',
            narrowsServices: 'Optional: narrows the list of services',
            autoBranch:
                'Just pick your service or your unit: the branch, the department or sub-directorate and the ' +
                'directorate fill themselves in.',
            servicesOfBothBranches: 'Services of both branches are listed.',
            directionNeedsBranch: 'Pick a service or a unit first',
            sectorNeedsService: 'Its service could not be found: pick it yourself from the list.',
            foundAutomatically: 'Found from your service or unit. Change the service to edit it.',
            personnelTypeGuide:
                'The list of who belongs to a category appears as soon as you choose one: check that you placed yourself in the right one.',
            noSector: 'No unit / sector attached to this service',
            sectorOptional: 'Optional: unit or sector attached to the service',
            chooseTradeBodyFirst: 'Choose the trade group first',
            optionalContract:
                'Optional fields: without a number or a document the submission still goes through, and the HR ' +
                'Department will ask you for it during verification.',
        },
        notes: {
            classificationCameroon: 'Cameroonian scale (civil servants). The index is calculated automatically.',
            classificationContract: 'Numeric classification (contract staff). The index is calculated automatically.',
            orgIntro:
                'Know your service or your unit? Pick them and the branch, the directorate and the department or ' +
                'sub-directorate fill themselves in. You can also start from the top: Directorate → Department or ' +
                'Sub-directorate → Service → Unit / Sector. The HR Department verifies this information before the ' +
                'final validation.',
        },
        bankChanges: {
            bank_name: 'bank name',
            bank_account_number: 'account number',
            cnps_number: 'CNPS number',
        },
        bankWarning: {
            title: '⚠️ You are changing your payment details',
            noValue: 'no value on file',
            intro: 'If this is not what the HR Department has on file, ',
            bold1: 'your salary will not be paid',
            middle: ' until the difference is sorted out. A confirmed change must be accompanied by a ',
            bold2: 'request to amend the bank details addressed to the Director General',
            ending:
                ' (with a bank identity statement in your name attached): without that document, the value already on ' +
                'file remains the reference.',
            ack: 'I have read this warning and I am preparing the request addressed to the Director General.',
            ackRequired: 'This box must be ticked before you can submit.',
            recap: (names: string) =>
                `⚠️ Declared change: ${names}. The transfer warning has been acknowledged — a request to amend the ` +
                'bank details must accompany the file.',
        },
        labels: {
            flaggedBadge: 'to correct',
            dash: '—',
            newSuffix: '· new',
            none: 'None.',
            edit: 'Edit',
            restore: 'Restore',
            cancel: 'Cancel',
            save: 'Save',
            previous: '← Previous',
            reviewCta: 'Review & Submit',
            backToForm: '← Back to correct',
            confirmSubmit: 'Confirm and Submit',
            sending: 'Sending...',
            offlineSubmit: 'Offline — cannot send',
            retry: 'Try again',
            hide: 'Hide',
            discardDraft: 'Start again from the data on the server',
            bornOn: (date: string) => `· born on ${date}`,
            level: (level: number) => `Level ${level}`,
            personNamed: (relationship: string, name: string) => `${relationship} “${name}”`,
            refusedOne: 'One field still blocks the submission',
            refusedMany: (count: number) => `${count} fields block the submission`,
            refusedFooter: (reviewLabel: string) =>
                'Nothing is lost: your draft stays on this device. Fix these points, then come back to ' +
                `${reviewLabel} to confirm the submission.`,
            offlineButtonNote:
                'Network back? The button enables itself again. Your draft stays on this device.',
            draftNoteReview:
                '✏️ Your draft is saved on this device after every change: you can close the page or lose the ' +
                'connection, nothing is lost.',
            draftNoteForm:
                '✏️ Your entries are saved on this device after every change: you can close the page or lose the ' +
                'connection, nothing is lost.',
        },
        screens: {
            offlineTitle: 'Internet connection required',
            offlineText:
                'The Recensement campaign cannot be opened without a network. Your draft is saved on this device ' +
                'and nothing is lost.',
            noCampaign: 'No Recensement campaign is currently open.',
            submitted: 'Recensement submitted',
            validated: 'Recensement validated',
            validatedText: 'Your information has been updated.',
            reviewIntro: 'Check your information carefully before submitting it definitively.',
            rejectionFields: 'Fields to correct (click to go there):',
            rejectionHint: 'The affected fields are highlighted in red below. Correct them and submit again.',
            canceledFallback: 'Recensement canceled by the HR Department',
            canceledHint: 'Check your information below and submit again.',
            restoredTitle: '📝 Draft found on this device',
            restoredText: (date: string) =>
                `Saved on ${date}. Your entries were kept and you can continue directly.`,
        },
        modals: {
            dependentTitle: 'Dependent',
            diplomaTitle: 'Diploma / Training',
            emptyDependents: 'No dependent has been declared.',
            emptyDiplomas: 'No diploma or training has been declared.',
            actEmployee: 'Employee’s birth certificate',
            actDependent: 'Dependent’s birth certificate',
            marriageCertificate: 'Marriage certificate',
            suffixRequired: '*',
            suffixIfChanged: '(attach if it changed)',
            suffixAlreadyProvided: '(optional — already provided)',
            actCoveredNote:
                '✅ The document that proves the family link is already on file for another parent: it will cover this ' +
                'declaration, there is no need to send it again.',
            actEmployeeNote:
                'It is YOUR birth certificate that proves the family link with this parent — the same document covers ' +
                'both the father and the mother.',
            contractDocLink: '📄 Contract already on file (attach a file to replace it)',
            serviceStartDocLink: '📄 Start-of-service document already on file (attach a file to replace it)',
        },
        alerts: {
            actParentRequired: (who: string) =>
                `To declare ${who}, attach YOUR birth certificate: it is the document that proves the family link. ` +
                'One document is enough for the father and the mother.',
            actMissing: (who: string) =>
                `${who}: their birth certificate is not attached. Open their row and select the file — an empty or ` +
                'oversized document is dropped by the server without the form knowing.',
            actParentInModal:
                'To declare a parent, attach YOUR birth certificate: it is the document that proves the family link.',
            actRequiredFor: (who: string) =>
                `For ${who}, the birth certificate is required. Check that the file is not empty (0 bytes): retake ` +
                'the photo if needed.',
            diplomaDocForEach: 'A supporting document is required for each new diploma.',
            diplomaDocRequired: 'A supporting document is required for a new diploma.',
            invalidYear: 'Invalid year.',
            offlineSubmit:
                'No internet connection: nothing can be sent right now. Your draft is saved on this device, you will ' +
                'be able to submit as soon as the network is back.',
            submitted: 'Your Recensement has been submitted for validation.',
            bankChanges: (names: string, section: string) =>
                `You changed ${names}. Tick the acknowledgement of the warning in the “${section}” section before ` +
                'you review and submit.',
            // The server answered nothing: either the link dropped mid-transfer, or the
            // attachments weighed more than the server is willing to read. The form already
            // refuses that weight (census.file.tooHeavy) — but its margin is this machine's
            // php.ini: elsewhere, a volume let through here can still die in transit, so both
            // causes stay worth naming.
            sendCut: (count: number, total: string) =>
                `The upload did not finish: ${count} attached document${count > 1 ? 's' : ''} travel ` +
                `with the form (${total} altogether) and no answer came back from the server. Either the connection ` +
                'was cut during the transfer, or those documents are too heavy for it: take the largest ones again, ' +
                'lighter, and send once more — your draft is kept, nothing is lost.',
        },
    },
    profile: {
        loadFailed: 'Unable to load your profile.',
        photoTitle: 'Change photo',
        sections: {
            assignment: 'Assignment',
            contact: 'Contact details',
            security: 'Security',
            danger: 'Danger Zone',
        },
        fields: {
            tradeBody: 'Trade group',
            qualification: 'Qualification',
            jobTitle: 'Position',
            service: 'Department',
            status: 'Status',
            phone: 'Phone',
            email: 'Email address',
            address: 'Address',
            city: 'City',
            currentPassword: 'Current password',
            newPassword: 'New password',
            confirmPassword: 'Confirm new password',
            reason: 'Reason',
            notes: 'Details (optional)',
        },
        reasonOptions: {
            resignation: 'Resignation',
            retirement: 'Retirement',
            other: 'Other',
        },
        dash: '—',
        hiddenPassword: '••••••••',
        edit: 'Edit',
        cancel: 'Cancel',
        saving: 'Saving...',
        save: 'Save',
        changePassword: 'Change password',
        confirm: 'Confirm',
        passwordChanged: '✅ Password changed successfully.',
        dangerIntro:
            'Deleting your account ends your access to the application (mobile and web). Your employee record ' +
            '(personal information, dependents, diplomas, history) is kept in full in the HR system.',
        deleteAccount: 'Delete my account',
        deleteWarning:
            'This action is irreversible. You will not be able to sign in again until an administrator creates a new account.',
        confirmWord: 'DELETE',
        typeToConfirm: (word: string) => `Type ${word} to confirm`,
        deleting: 'Deleting...',
        deleteForever: 'Delete permanently',
        errors: {
            allFields: 'Please fill in all fields.',
            passwordMismatch: 'The two new passwords do not match.',
            passwordShort: 'The new password must be at least 8 characters.',
            confirmWord: (word: string) => `Please type ${word} to confirm.`,
            passwordRequired: 'Please enter your password.',
        },
    },
    preferences: {
        title: 'Preferences',
        intro:
            'They apply right away, with no button to confirm them. Language, appearance and font follow your account on your other devices; the server address stays set on the one you are using, because it depends on the network you are connected to.',
        storageRefused:
            'Applied now, but it will not be there next time you open the portal and it will not follow your account either: this browser refuses to save preferences (private browsing, privacy extension).',
        theme: {
            section: 'Appearance',
            label: 'Theme',
            hint:
                '“System” follows your device setting, including when it changes while you are using the portal. Only the backgrounds go dark: the layout and the colour of every button stay the same.',
            options: {
                light: 'Light',
                dark: 'Dark',
                system: 'System',
            },
        },
        font: {
            section: 'Font',
            sizeLabel: 'Text size',
            sizeHint: 'The whole interface follows, buttons and tables included, not the text alone.',
            sizeOptions: {
                sm: 'Small',
                md: 'Normal',
                lg: 'Large',
            },
            familyLabel: 'Font style',
            familyHint:
                'These fonts are already installed on your computer or phone: nothing is downloaded, so the portal stays readable without an Internet connection.',
            familyOptions: {
                system: 'Standard',
                arial: 'Arial',
                verdana: 'Verdana',
                georgia: 'Georgia',
            },
        },
        sync: {
            section: 'Account and devices',
            states: {
                reading: 'Reading your account…',
                queued: 'Your settings just changed: saving them in a moment.',
                writing: 'Saving to your account…',
                syncedJustNow: 'Your settings are saved on your account: they will follow you to any device you sign in to.',
                syncedAligned: 'Nothing to save: this device and your account hold exactly the same settings.',
                lastExchangeAt: (time: string) => `Last exchange with the account at ${time}.`,
                offline:
                    'The server did not answer: your settings stay applied on this device, and your account keeps its previous copy. Try again once the connection is back.',
                noRoute:
                    'The API server reached here does not know account settings yet: this portal is newer than the server. Your settings work on this device, but they will not follow you elsewhere until the server is updated — please tell the HR department.',
                refused: (status: number) =>
                    `The server refused the save (code ${status}): your account keeps its previous copy. This browser and that server probably are not on the same version.`,
            },
            retry: 'Sync now',
            retryHint: 'Reads the account again and sends what it still misses, without reloading the page.',
            note:
                'These follow your account: language, appearance and font. This one stays on the device you set it on: the server address, because it depends on the network you are connected to.',
        },
        language: {
            section: 'Language',
            hint:
                'This is the setting the whole portal follows; the sign-in and activation screens keep their own FR / EN buttons, because they come before anyone knows who you are.',
        },
        server: {
            section: 'Server',
            currentLabel: 'Address in use',
            currentHint: (origin: string) => `Chosen by ${origin}.`,
            origins: {
                override: 'your setting in this browser',
                config: 'the configuration file placed on the server',
                build: 'the address built into the installed version',
            },
            sameOrigin: 'same origin as this page',
            testButton: 'Test the connection',
            testAgainButton: 'Test again',
            testing: 'Testing…',
            ok: (ms: number, name: string) => `✅ Server reached in ${ms} ms: ${name}.`,
            okNoName: (ms: number) => `✅ Server reached in ${ms} ms.`,
            http: (status: number) =>
                `⚠️ An answer did come back, but the server returns HTTP error ${status}. This may be the website address rather than the API address, which normally ends with “/api”.`,
            timeout: (seconds: number) =>
                `⏱️ No answer after ${seconds} seconds. The server is not answering, or takes longer than this limit.`,
            opaque:
                '⚠️ The server did answer, but the browser refuses to let this page read the answer: this website address is not in the list of sites the API allows (a server setting).',
            unreachable:
                '❌ This address did not answer, or the browser blocked the request before sending it. The two look the same from the page: check the address you typed, then your access to the network.',
            mixedContent:
                '🚫 The browser cannot test this address: this page is served over a secure connection (https), and a local http server cannot be called from a secure page.',
            mixedContentHowTo:
                'Inside the hospital, open the local server address directly in the browser (for example http://116.72.30.12:8084). The page and the API then come from the same origin: calls are no longer blocked, and this setting becomes unnecessary.',
            overrideTitle: 'Address to use from this browser',
            overrideHint:
                'Meant for the hospital local network, or for troubleshooting. While this field is empty, the address provided by the server applies.',
            overridePlaceholder: 'Example: http://116.72.30.12:8084/api',
            save: 'Save',
            clear: 'Back to the server address',
            saved: 'Address saved for this browser. It applies from the next call, without signing you out.',
            cleared: 'Your setting was removed: the server address applies again.',
            invalidAddress:
                'Incomplete address: give the server with “http://” or “https://”, or a path starting with “/”, for example “/api”.',
            emptyAddress: 'Type an address, or choose “Back to the server address”.',
            notStoredAddress:
                'Address applied right away, but this browser refuses to save it: it will be forgotten next time you open the portal.',
        },
    },
};
