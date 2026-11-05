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
            'Your network is working, but the server is not answering. Try again in a moment.',
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
};
